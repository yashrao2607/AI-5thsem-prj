"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, Bot, Loader2, Upload, FileText, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8501';

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hello! 👋 I\'m your AI assistant. Upload documents first, then ask me questions about them.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    const fileNames: string[] = [];

    Array.from(files).forEach((file) => {
      formData.append('files', file);
      fileNames.push(file.name);
    });

    try {
      const response = await fetch(`${RAG_API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'ok') {
        setUploadedFiles((prev) => [...prev, ...fileNames]);
        const successMsg: Message = {
          sender: 'bot',
          text: `✅ Successfully uploaded ${fileNames.length} file(s):\n${fileNames.map((f) => `• ${f}`).join('\n')}\n\nNow you can ask me questions about these documents!`,
        };
        setMessages((prev) => [...prev, successMsg]);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorText = '❌ Upload Error: ';
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        errorText += `Cannot reach RAG server at ${RAG_API_URL}\n\n✅ Make sure:\n1. Ollama is running (ollama serve)\n2. RAG server is running (python rag-server.py)\n3. Port 8501 is accessible`;
      } else {
        errorText += error.message;
      }

      const errorMsg: Message = {
        sender: 'bot',
        text: errorText,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsUploading(false);
      setShowUpload(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || uploadedFiles.length === 0) {
      if (uploadedFiles.length === 0) {
        const msg: Message = {
          sender: 'bot',
          text: '⚠️ Please upload at least one document before asking questions.',
        };
        setMessages((prev) => [...prev, msg]);
      }
      return;
    }

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${RAG_API_URL}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentInput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'ok') {
        const botMessage: Message = {
          sender: 'bot',
          text: data.answer || 'Sorry, I could not generate an answer.',
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorText = '❌ Error: ';
      if (error.message.includes('Failed to fetch')) {
        errorText += `Cannot connect to RAG server at ${RAG_API_URL}\n\n✅ Make sure:\n1. Ollama is running\n2. RAG server is running: python rag-server.py\n3. Port 8501 is accessible`;
      } else if (error.message.includes('Network')) {
        errorText += `Network error. Check if RAG server (${RAG_API_URL}) is running.`;
      } else {
        errorText += error.message;
      }

      const errorMessage: Message = {
        sender: 'bot',
        text: errorText,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && uploadedFiles.length > 0) {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent text-white p-4 rounded-t-lg flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">CognitoAI Assistant</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="border-b p-4 bg-muted/50">
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/30 bg-muted/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Drag files here or click
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files!)}
                  disabled={isUploading}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setShowUpload(false)}
              >
                Close Upload
              </Button>
            </div>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="border-b p-3 bg-muted/30 max-h-24 overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                📄 Uploaded Documents ({uploadedFiles.length})
              </p>
              <div className="space-y-1">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-primary/10 rounded px-2 py-1"
                  >
                    <span className="text-xs truncate text-foreground">
                      {file}
                    </span>
                    <Trash2 className="w-3 h-3 text-destructive cursor-pointer opacity-50 hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <Avatar className="w-6 h-6 border">
                    <AvatarFallback className="text-xs">
                      <Bot className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-6 h-6 border">
                  <AvatarFallback className="text-xs">
                    <Bot className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted px-3 py-2 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-muted/50 rounded-b-lg space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder={
                  uploadedFiles.length > 0
                    ? 'Ask about your documents...'
                    : 'Upload files first...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || uploadedFiles.length === 0}
                className="text-sm"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={
                  isLoading || input.trim() === '' || uploadedFiles.length === 0
                }
                className="h-9 w-9"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowUpload(!showUpload)}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 mr-1" />
                  {uploadedFiles.length > 0 ? 'Add More Docs' : 'Upload Documents'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </Button>
    </div>
  );
}
