
"use client";
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, Paperclip } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { useUser } from '@/firebase';

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

const RAG_API_URL = process.env.NEXT_PUBLIC_RAG_API_URL || 'http://localhost:8000';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const { toast } = useToast();
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking, isProcessingFile]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    
    const file = files[0];
    if (!file) return;

    setIsProcessingFile(true);
    toast({ title: 'Processing Document', description: 'Uploading and indexing document...' });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.uid);

      const uploadResponse = await fetch(`${RAG_API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || "Failed to upload document");
      }

      const uploadResult = await uploadResponse.json();
      toast({ title: 'Processing Complete', description: uploadResult.message });

    } catch (err: any) {
      console.error("Error processing file:", err);
      toast({ variant: 'destructive', title: 'Processing Failed', description: err.message || 'There was an error processing your document.' });
    } finally {
        setIsProcessingFile(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isAsking || !user) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsAsking(true);

    try {
        const queryResponse = await fetch(`${RAG_API_URL}/api/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: currentInput,
            user_id: user.uid,
            top_k: 5,
            detail_level: 'detailed'
          })
        });

        if (!queryResponse.ok) {
          const errorData = await queryResponse.json();
          throw new Error(errorData.detail || "Failed to get response");
        }

        const result = await queryResponse.json();
        const aiMessage: Message = { sender: 'ai', text: result.answer };
        setMessages((prev) => [...prev, aiMessage]);
    } catch(error) {
        console.error("Error communicating with RAG:", error);
        const errorMessage: Message = { sender: 'ai', text: "Sorry, I encountered an error while processing your question. Please try again." };
        setMessages((prev) => [...prev, errorMessage]);
        toast({
            variant: "destructive",
            title: "RAG System Error",
            description: "There was an issue getting a response from the RAG system. Please check your connection and try again.",
        });
    } finally {
        setIsAsking(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <Avatar className="w-8 h-8 border">
                <AvatarFallback><Bot size={18} /></AvatarFallback>
              </Avatar>
            )}
            <div className={`rounded-2xl p-3 max-w-lg prose prose-sm dark:prose-invert ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
             {msg.sender === 'user' && (
              <Avatar className="w-8 h-8 border">
                <AvatarFallback><User size={18} /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
         {messages.length === 0 && !isProcessingFile && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Bot size={48} className="mx-auto" />
              <p className="mt-2">Ask me anything about your reports.</p>
              <p className="text-xs">Upload documents using the paperclip icon to begin.</p>
            </div>
          </div>
        )}
        {isAsking && (
            <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border">
                    <AvatarFallback><Bot size={18} /></AvatarFallback>
                </Avatar>
                <div className="rounded-2xl p-3 max-w-md bg-muted flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                </div>
            </div>
        )}
        {isProcessingFile && (
            <div className="flex items-start gap-3 justify-center">
                <div className="rounded-2xl p-3 max-w-md bg-muted flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Processing document...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-background">
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder={"Ask about your reports..."}
                className="pr-24"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isAsking || isProcessingFile}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e.target.files)} accept=".pdf,image/*" />
                <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isAsking || isProcessingFile}>
                  <Paperclip className="h-5 w-5" />
                   <span className="sr-only">Upload Document</span>
                </Button>
                <Button size="icon" onClick={handleSendMessage} disabled={isAsking || isProcessingFile || !input}>
                  <Send className="h-5 w-5" />
                   <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">You can ask questions about all the documents you have uploaded in the Reports page.</p>
      </div>
    </div>
  );
}
