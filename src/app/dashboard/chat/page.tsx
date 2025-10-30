"use client";
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, Bot, User, File as FileIcon, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { answerQuestionsAboutReport } from '@/ai/flows/answer-questions-about-report';
import { useToast } from "@/hooks/use-toast"

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFileDataUri(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    if (!fileDataUri) {
        toast({
            variant: "destructive",
            title: "File Required",
            description: "Please upload a report file before asking a question.",
        });
        return;
    }

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const result = await answerQuestionsAboutReport({ reportDataUri: fileDataUri, question: input });
        const aiMessage: Message = { sender: 'ai', text: result.answer };
        setMessages((prev) => [...prev, aiMessage]);
    } catch(error) {
        console.error("Error with AI call:", error);
        const errorMessage: Message = { sender: 'ai', text: "Sorry, I couldn't process that. Please try again." };
        setMessages((prev) => [...prev, errorMessage]);
        toast({
            variant: "destructive",
            title: "AI Error",
            description: "There was an issue communicating with the AI.",
        });
    } finally {
        setIsLoading(false);
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
            <div className={`rounded-2xl p-3 max-w-md ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
             {msg.sender === 'user' && (
              <Avatar className="w-8 h-8 border">
                <AvatarFallback><User size={18} /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
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
      </div>
      <div className="p-4 border-t bg-background">
        <Card className="glass">
          <CardContent className="p-2">
            {file && (
              <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
                <FileIcon className="h-4 w-4" />
                <span className="font-medium truncate">{file.name}</span>
                <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => { setFile(null); setFileDataUri(null) }}>
                  <span className="sr-only">Remove file</span>
                  &times;
                </Button>
              </div>
            )}
            <div className="relative flex items-center">
              <Input
                type="text"
                placeholder="Ask a question about your report..."
                className="pr-24"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !fileDataUri}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <Button asChild variant="ghost" size="icon">
                  <label htmlFor="file-upload">
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                  </label>
                </Button>
                <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,image/*" />
                <Button size="icon" onClick={handleSendMessage} disabled={isLoading}>
                  <Send className="h-5 w-5" />
                   <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">First, upload a PDF or image of your report to start the conversation.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
