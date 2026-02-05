'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Loader2, Send, User, Sparkles, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { homeworkHelperAction } from '@/app/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/firebase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function HomeworkHelperPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Exam & Homework Helper. Stuck on a tough question? Paste it here, and I'll walk you through the steps to solve it!",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
       const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
       if (viewport) {
           viewport.scrollTop = viewport.scrollHeight;
       }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const result = await homeworkHelperAction({
        question: currentInput,
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
                    Get step-by-step explanations for your academic questions.
                </CardDescription>
            </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
             <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                     {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                     )}
                    <div className={cn("max-w-[80%] rounded-lg p-3 text-sm prose prose-sm", message.role === 'user' ? 'bg-primary text-primary-foreground prose-invert' : 'bg-muted')}>
                        <p className="whitespace-pre-wrap m-0">{message.content}</p>
                    </div>
                     {message.role === 'user' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                     )}
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

            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your homework question here..."
                  className="flex-1 resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={isLoading || !input.trim()}>
                   {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
