# 🚀 CognitoAI RAG Server Setup Guide

## Overview
This guide helps you set up and run the Advanced RAG (Retrieval-Augmented Generation) Assistant that powers the floating chatbot in CognitoAI.

---

## 📋 Prerequisites

Make sure you have installed:
1. **Python 3.10+**
2. **Ollama** - Download from https://ollama.ai
3. **pip** (Python package manager)

---

## 🛠️ Step 1: Install Ollama & Models

### 1.1 Download & Install Ollama
- Go to https://ollama.ai
- Download for your OS (Windows, macOS, Linux)
- Run the installer

### 1.2 Pull Required Models
Open a terminal and run:

```bash
# Download embedding model (required for vector embeddings)
ollama pull nomic-embed-text

# Download LLM model (required for AI responses)
ollama pull mistral
```

**Note:** These are large models (2-8GB each). First download may take 5-10 minutes.

Verify models are installed:
```bash
ollama list
```

You should see:
```
NAME                    ID              SIZE      MODIFIED
nomic-embed-text:latest abc123...       274 MB    2 hours ago
mistral:latest          def456...       4.1 GB    1 hour ago
```

---

## 🔧 Step 2: Set Up Python Environment

### 2.1 Create Virtual Environment
```bash
# Navigate to project directory
cd c:\Users\KRISH\Desktop\yash\studio

# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 2.2 Install Dependencies
```bash
pip install -r requirements-rag.txt
```

---

## 🚀 Step 3: Start the RAG Server

### 3.1 Ensure Ollama is Running
```bash
# Ollama should be running in background (check taskbar/system tray)
# Or run in terminal:
ollama serve
```

### 3.2 Start the Flask RAG Server
In a new terminal (with venv activated):

```bash
python rag-server.py
```

You should see:
```
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
```

### 3.3 Test the Server
Open another terminal and run:

```bash
# Check if server is running
curl http://localhost:8501/

# Check status and dependencies
curl http://localhost:8501/api/status
```

---

## 💻 Step 4: Configure Frontend

The frontend (Next.js app) is already configured to use the RAG server.

### 4.1 Environment Variables
File: `.env.local` (already created)

```env
NEXT_PUBLIC_RAG_API_URL=http://localhost:8501
```

Change if your server runs on a different port/host.

### 4.2 Start Next.js Frontend
In a new terminal (in project root):

```bash
npm run dev
```

---

## 🎯 Using the Chatbot

1. **Open the app**: http://localhost:3000
2. **Click the bot icon** (bottom right)
3. **Upload Documents**:
   - Click "Upload Documents" button
   - Drag & drop files (PDF, DOCX, TXT, CSV)
   - Wait for upload to complete
4. **Ask Questions**:
   - Type your question in the input field
   - Press Enter or click Send
   - Bot will search uploaded documents and generate an answer

---

## 🔍 Troubleshooting

### Error: "Failed to fetch"
**Issue**: Frontend can't connect to RAG server

**Solutions**:
1. ✅ Check Ollama is running: `ollama serve`
2. ✅ Check RAG server is running: `python rag-server.py`
3. ✅ Verify port 8501 is accessible
4. ✅ Try: `curl http://localhost:8501/`

### Error: "Connection refused"
**Solutions**:
1. Make sure port 8501 is not blocked
2. Try running server on different port:
   ```python
   # In rag-server.py, change last line:
   app.run(host="0.0.0.0", port=8502, debug=False)
   # Update .env.local accordingly
   ```

### Error: "Model not found"
**Solutions**:
1. Pull the model: `ollama pull nomic-embed-text`
2. Pull the LLM: `ollama pull mistral`
3. List models: `ollama list`

### Upload fails
**Solutions**:
1. Check file format is supported (PDF, DOCX, TXT, CSV)
2. Check file size (should be < 100MB)
3. Check server logs for errors
4. Ensure Ollama embeddings are working

### Slow responses
**Solutions**:
1. First run is slower (loads models)
2. RAG embedding takes time for large documents
3. Increase system RAM if possible
4. Use smaller documents or chunks

---

## 📚 API Documentation

### Upload Documents
```bash
curl -X POST http://localhost:8501/api/upload \
  -F "files=@document.pdf" \
  -F "files=@report.docx"
```

**Response:**
```json
{
  "status": "ok",
  "message": "Processed 2 files successfully",
  "files": [
    {"file": "document.pdf", "chunks": 45, "status": "success"},
    {"file": "report.docx", "chunks": 38, "status": "success"}
  ]
}
```

### Ask a Question
```bash
curl -X POST http://localhost:8501/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?"}'
```

**Response:**
```json
{
  "status": "ok",
  "answer": "The document discusses...",
  "retrieved_ids": [0, 1, 2, 3]
}
```

### Server Status
```bash
curl http://localhost:8501/api/status
```

**Response:**
```json
{
  "server": "running",
  "dependencies": {
    "ollama": "connected",
    "chromadb": "connected"
  }
}
```

---

## 🗂️ File Structure

```
studio/
├── rag-server.py              # Flask RAG server
├── requirements-rag.txt       # Python dependencies
├── .env.local                 # Frontend config
├── demo-rag-chroma/           # ChromaDB vector storage (auto-created)
└── src/
    └── components/
        └── floating-chatbot.tsx  # Frontend chatbot component
```

---

## 🔐 Security Notes

⚠️ **Development Only**: This setup is for development. For production:
1. Add authentication to API endpoints
2. Implement rate limiting
3. Add request validation
4. Use environment variables for API keys
5. Deploy on secure infrastructure
6. Add HTTPS/SSL

---

## 📖 Additional Resources

- **Ollama**: https://ollama.ai
- **ChromaDB**: https://docs.trychroma.com
- **LangChain**: https://python.langchain.com
- **Flask-CORS**: https://flask-cors.readthedocs.io

---

## 🆘 Need Help?

1. Check server logs: `python rag-server.py`
2. Run status check: `curl http://localhost:8501/api/status`
3. Test with simple PDF first
4. Check browser console (F12) for frontend errors

---

**Happy RAG-ing! 🚀**
