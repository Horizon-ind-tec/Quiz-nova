'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Loader2, Send, User, GraduationCap, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { homeworkHelperAction } from '@/app/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    type: 'image' | 'pdf';
    name: string;
    url: string;
  };
}

export default function HomeworkHelperPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Exam & Homework Helper. Stuck on a tough question? Paste it here, or upload an image/PDF of your assignment, and I'll walk you through the steps to solve it!",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ file: File; dataUri: string; type: 'image' | 'pdf' } | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
       const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
       if (viewport) {
           viewport.scrollTop = viewport.scrollHeight;
       }
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
      });
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      toast({
        variant: 'destructive',
        title: 'Unsupported file type',
        description: 'Please upload an image or a PDF document.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedFile({
          file,
          dataUri: event.target.result as string,
          type: isImage ? 'image' : 'pdf',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input || (attachedFile ? `I've attached a ${attachedFile.type}. Please scan it.` : ''),
      attachment: attachedFile ? {
        type: attachedFile.type,
        name: attachedFile.file.name,
        url: attachedFile.dataUri
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentFile = attachedFile;
    
    setInput('');
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const result = await homeworkHelperAction({
        question: currentInput,
        mediaDataUri: currentFile?.dataUri,
      });

      if (result && result.explanation) {
        const assistantMessage: Message = { role: 'assistant', content: result.explanation };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('The AI did not return a helpful response.');
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to get help from AI.',
      });
      setMessages(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Exam & Homework Helper" />
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <Card className="flex-1 flex flex-col min-h-0">
           <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    Homework Assistant
                </CardTitle>
                <CardDescription>
                    Get step-by-step explanations. Type your question or upload a photo/PDF.
                </CardDescription>
            </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
             <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex flex-col gap-3", message.role === 'user' ? 'items-end' : 'items-start')}>
                    <div className={cn("flex items-start gap-3", message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className={cn(message.role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-[85%] rounded-lg p-3 text-sm prose prose-sm", message.role === 'user' ? 'bg-primary text-primary-foreground prose-invert' : 'bg-muted')}>
                            {message.attachment && (
                                <div className="mb-3 rounded-md overflow-hidden border border-white/20">
                                    {message.attachment.type === 'image' ? (
                                        <Image src={message.attachment.url} alt="Attached" width={300} height={200} className="w-full h-auto object-contain" />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-white/10">
                                            <FileText className="h-8 w-8" />
                                            <span className="font-medium truncate">{message.attachment.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <p className="whitespace-pre-wrap m-0">{message.content}</p>
                        </div>
                    </div>
                  </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    </div>
                 )}
              </div>
            </ScrollArea>

            <div className="border-t p-4 bg-card">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-4xl mx-auto">
                {attachedFile && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md mb-2 w-fit">
                        {attachedFile.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        <span className="text-xs truncate max-w-[200px]">{attachedFile.file.name}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachedFile(null)}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,application/pdf"
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-12 w-12 shrink-0 rounded-full" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question or upload homework..."
                        className="flex-1 resize-none"
                        rows={2}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                handleSubmit(e);
                            }
                        }}
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="h-12 w-12 shrink-0 rounded-full" disabled={isLoading || (!input.trim() && !attachedFile)}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
