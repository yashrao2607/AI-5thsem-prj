#!/usr/bin/env python3
"""
Advanced RAG Assistant - Flask Server
Handles document upload, embedding, and AI-powered Q&A
"""

import os
import tempfile
import re
import chromadb
import ollama
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from chromadb.utils.embedding_functions.ollama_embedding_function import OllamaEmbeddingFunction
from langchain_community.document_loaders import (
    PyMuPDFLoader,
    UnstructuredWordDocumentLoader,
    TextLoader,
)
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import CrossEncoder

# ----------------------------- #
# FLASK SETUP
# ----------------------------- #
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ----------------------------- #
# SYSTEM PROMPT
# ----------------------------- #
system_prompt = """
You are an advanced AI assistant specializing in answering questions based on provided context documents.

Your task:
1. Carefully read and understand the context provided
2. Identify the most relevant information that directly answers the question
3. Provide a clear, accurate, and comprehensive answer
4. If the context contains the answer, use it directly
5. If the context is partially relevant, combine information logically
6. If the context doesn't contain enough information, say so clearly

Answer format:
- Be direct and specific
- Use information from the context when available
- Cite specific details from the context when relevant
- If you're uncertain, indicate what information is available and what's missing
- Avoid making up information not present in the context
"""

# ----------------------------- #
# DOCUMENT PROCESSING
# ----------------------------- #
def process_document(file_path, file_name):
    """Process various document types and split into chunks"""
    file_ext = os.path.splitext(file_name)[-1].lower()
    
    try:
        if file_ext == ".pdf":
            loader = PyMuPDFLoader(file_path)
            docs = loader.load()
        elif file_ext in [".docx", ".doc"]:
            loader = UnstructuredWordDocumentLoader(file_path)
            docs = loader.load()
        elif file_ext == ".txt":
            loader = TextLoader(file_path)
            docs = loader.load()
        elif file_ext == ".csv":
            df = pd.read_csv(file_path)
            docs = [Document(page_content=row.to_string(), metadata={"row": i}) for i, row in df.iterrows()]
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

        # Improved chunking: smaller chunks with better overlap for better retrieval
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,  # Smaller chunks for better precision
            chunk_overlap=150,  # Good overlap to maintain context
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]  # Better separation
        )
        chunks = splitter.split_documents(docs)
        
        # Add source file metadata to each chunk
        for chunk in chunks:
            if "source" not in chunk.metadata:
                chunk.metadata["source"] = file_name
        
        return chunks
    except Exception as e:
        print(f"Error processing document {file_name}: {str(e)}")
        raise

# ----------------------------- #
# VECTOR STORE 
# ----------------------------- #
def get_vector_collection():
    """Get or create ChromaDB collection with Ollama embeddings"""
    try:
        ollama_ef = OllamaEmbeddingFunction(
            url="http://localhost:11434/api/embeddings",
            model_name="nomic-embed-text:latest",
        )
        chroma_client = chromadb.PersistentClient(path="./demo-rag-chroma")
        return chroma_client.get_or_create_collection(
            name="rag_app",
            embedding_function=ollama_ef,
            metadata={"hnsw:space": "cosine"},
        )
    except Exception as e:
        print(f"Error getting vector collection: {str(e)}")
        raise

def add_to_vector_collection(docs, file_name):
    """Add documents to vector collection"""
    try:
        collection = get_vector_collection()
        ids, texts, metas = [], [], []
        for i, d in enumerate(docs):
            ids.append(f"{file_name}_{i}")
            texts.append(d.page_content)
            metas.append(d.metadata)
        collection.upsert(ids=ids, documents=texts, metadatas=metas)
        return len(docs)
    except Exception as e:
        print(f"Error adding to vector collection: {str(e)}")
        raise

def query_collection(prompt, n=50):
    """Query vector collection for relevant documents"""
    try:
        col = get_vector_collection()
        res = col.query(query_texts=[prompt], n_results=n)
        return res
    except Exception as e:
        print(f"Error querying collection: {str(e)}")
        raise

# ----------------------------- #
# RERANKING
# ----------------------------- #
def re_rank_cross_encoders(query, documents, top_k=15, min_score=0.0):
    """Rerank documents using cross-encoder for better relevance"""
    if not documents:
        return "", []
    
    try:
        encoder_model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-12-v2")
        # Get scores for all documents
        pairs = [(query, doc) for doc in documents]
        scores = encoder_model.predict(pairs)
        
        # Convert scores to list if it's a numpy array
        if hasattr(scores, 'tolist'):
            scores = scores.tolist()
        elif not isinstance(scores, list):
            scores = list(scores)
        
        # Create list of (score, index, doc) tuples
        scored_docs = [(float(score), idx, documents[idx]) for idx, score in enumerate(scores)]
        
        # Sort by score descending
        scored_docs.sort(reverse=True, key=lambda x: x[0])
        
        # Filter by minimum score and take top_k
        filtered_docs = [item for item in scored_docs if item[0] >= min_score][:top_k]
        
        if not filtered_docs:
            # If no docs meet threshold, use top ones anyway
            filtered_docs = scored_docs[:min(top_k, len(scored_docs))]
        
        # Extract text and IDs
        relevant_text = "\n\n--- Document Chunk ---\n".join([doc for _, _, doc in filtered_docs])
        relevant_ids = [idx for _, idx, _ in filtered_docs]
        
        return relevant_text, relevant_ids
    except Exception as e:
        print(f"Error reranking: {str(e)}")
        # Fallback to top documents
        return "\n\n--- Document Chunk ---\n".join(documents[:min(top_k, len(documents))]), list(range(min(top_k, len(documents))))

# ----------------------------- #
# LLM CALL
# ----------------------------- #
def call_llm_collect(context, prompt):
    """Call Ollama LLM with context and prompt"""
    try:
        # Format context better for the LLM
        formatted_context = f"""Below are relevant document chunks that may contain information to answer the question.

{context}

Please answer the following question based on the context provided above. If the context doesn't contain enough information to fully answer the question, please indicate what information is available and what's missing."""
        
        user_message = f"{formatted_context}\n\nQuestion: {prompt}\n\nAnswer:"
        
        response = ollama.chat(
            model="mistral:latest",
            stream=False,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
        )
        
        if isinstance(response, dict) and "message" in response:
            return response["message"].get("content", "").strip()
        return str(response).strip()
    except Exception as e:
        print(f"Error calling LLM: {str(e)}")
        raise

# ----------------------------- #
# API ROUTES
# ----------------------------- #

@app.route("/", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "Advanced RAG Assistant",
        "version": "1.0.0"
    })

@app.route("/api/upload", methods=["POST"])
def upload():
    """Upload documents and add to vector store"""
    try:
        files = request.files.getlist("files")
        if not files:
            return jsonify({"status": "error", "message": "No files uploaded"}), 400

        result = []
        for f in files:
            if f.filename == '':
                continue
                
            temp_path = tempfile.NamedTemporaryFile(
                delete=False, 
                suffix=os.path.splitext(f.filename)[-1]
            ).name
            
            try:
                f.save(temp_path)
                docs = process_document(temp_path, f.filename)
                count = add_to_vector_collection(docs, f.filename)
                result.append({
                    "file": f.filename,
                    "chunks": count,
                    "status": "success"
                })
            except Exception as e:
                result.append({
                    "file": f.filename,
                    "status": "error",
                    "message": str(e)
                })
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)

        return jsonify({
            "status": "ok",
            "message": f"Processed {len([r for r in result if r['status'] == 'success'])} files successfully",
            "files": result
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/ask", methods=["POST"])
def ask():
    """Ask questions about uploaded documents"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No JSON data provided"}), 400
            
        q = data.get("question", "").strip()
        if not q:
            return jsonify({"status": "error", "message": "No question provided"}), 400

        # Retrieve more documents initially for better coverage
        res = query_collection(q, n=50)
        docs = res["documents"][0] if res and "documents" in res else []
        
        if not docs:
            return jsonify({
                "status": "ok",
                "answer": "I couldn't find relevant information in the uploaded documents. Please try uploading documents or ask a different question.",
                "retrieved_ids": [],
                "sources_used": 0
            })
        
        # Rerank with more top_k and better filtering
        ctx, ids = re_rank_cross_encoders(q, docs, top_k=15, min_score=-1.0)
        
        # Check if we have meaningful context
        if not ctx or len(ctx.strip()) < 50:
            return jsonify({
                "status": "ok",
                "answer": "I found some documents, but they don't seem to contain enough relevant information to answer your question. Please try rephrasing your question or uploading more relevant documents.",
                "retrieved_ids": ids,
                "sources_used": len(ids)
            })
        
        answer = call_llm_collect(ctx, q)
        
        return jsonify({
            "status": "ok",
            "answer": answer,
            "retrieved_ids": ids,
            "sources_used": len(ids),
            "total_retrieved": len(docs)
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/status", methods=["GET"])
def status():
    """Get server status and dependencies"""
    status_info = {
        "server": "running",
        "dependencies": {}
    }
    
    try:
        # Check Ollama
        ollama.list()
        status_info["dependencies"]["ollama"] = "connected"
    except Exception as e:
        status_info["dependencies"]["ollama"] = f"error: {str(e)}"
    
    try:
        # Check ChromaDB
        get_vector_collection()
        status_info["dependencies"]["chromadb"] = "connected"
    except Exception as e:
        status_info["dependencies"]["chromadb"] = f"error: {str(e)}"
    
    return jsonify(status_info)

# ----------------------------- #
# ERROR HANDLERS
# ----------------------------- #

@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Endpoint not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"status": "error", "message": "Internal server error"}), 500

# ----------------------------- #
# ENTRY POINT
# ----------------------------- #
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════╗
    ║   Advanced RAG Assistant - Flask Server      ║
    ║   Running on http://0.0.0.0:8501             ║
    ║                                              ║
    ║   Make sure you have:                        ║
    ║   • Ollama running (http://localhost:11434)  ║
    ║   • Models: nomic-embed-text, mistral        ║
    ║                                              ║
    ║   API Endpoints:                             ║
    ║   • POST /api/upload - Upload documents      ║
    ║   • POST /api/ask    - Ask questions         ║
    ║   • GET  /api/status - Server status         ║
    ╚══════════════════════════════════════════════╝
    """)
    app.run(host="0.0.0.0", port=8501, debug=False)
