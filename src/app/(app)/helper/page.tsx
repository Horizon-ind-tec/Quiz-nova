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

    // Minimum 12KB check
    if (file.size < 12 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too small',
        description: 'Please upload a file larger than 12KB for processing.',
      });
      return;
    }

    // Maximum 1GB check
    if (file.size > 1024 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload a file smaller than 1GB.',
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
    <div className="flex flex-col h-screen overflow-hidden">
      <Header title="Exam Helper" />
      <main className="flex-1 flex flex-col p-2 md:p-6 overflow-hidden">
        <Card className="flex-1 flex flex-col min-h-0 shadow-sm border-slate-200">
           <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="flex items-center gap-2 text-sm md:text-xl uppercase tracking-tighter font-black">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                    Homework Assistant
                </CardTitle>
            </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50/30">
             <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollAreaRef}>
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex flex-col gap-2", message.role === 'user' ? 'items-end' : 'items-start')}>
                    <div className={cn("flex items-start gap-2.5", message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                        <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                            <AvatarFallback className={cn(message.role === 'assistant' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600")}>
                                {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "max-w-[85%] rounded-2xl p-3 text-xs md:text-sm shadow-sm", 
                            message.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'
                        )}>
                            {message.attachment && (
                                <div className="mb-3 rounded-lg overflow-hidden border border-black/5 bg-slate-100">
                                    {message.attachment.type === 'image' ? (
                                        <Image src={message.attachment.url} alt="Attached" width={300} height={200} className="w-full h-auto object-contain" />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3">
                                            <FileText className="h-6 w-6 text-slate-500" />
                                            <span className="font-bold truncate text-[10px]">{message.attachment.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap m-0 leading-relaxed">{message.content}</p>
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-2.5">
                        <Avatar className="h-7 w-7 md:h-8 md:w-8">
                            <AvatarFallback className="bg-indigo-600 text-white"><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-white border rounded-2xl p-3 rounded-tl-none shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        </div>
                    </div>
                 )}
              </div>
            </ScrollArea>

            <div className="border-t p-3 md:p-4 bg-white">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-4xl mx-auto">
                {attachedFile && (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-lg mb-1 w-fit border">
                        {attachedFile.type === 'image' ? <ImageIcon className="h-3.5 w-3.5 text-slate-500" /> : <FileText className="h-3.5 w-3.5 text-slate-500" />}
                        <span className="text-[10px] font-bold truncate max-w-[150px] uppercase">{attachedFile.file.name}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5 hover:bg-slate-200" onClick={() => setAttachedFile(null)}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}
                <div className="flex items-end gap-2">
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
                        className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full border-slate-200" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                    >
                        <Paperclip className="h-5 w-5 text-slate-500" />
                    </Button>
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything..."
                        className="flex-1 min-h-[40px] max-h-[120px] py-2 resize-none rounded-xl border-slate-200 focus:ring-indigo-500 text-sm"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading || (!input.trim() && !attachedFile)}>
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
