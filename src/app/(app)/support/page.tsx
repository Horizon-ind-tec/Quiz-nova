'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Loader2, Send, User, HelpCircle, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supportBotAction } from '@/app/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function SupportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm Nova Support. How can I help you today? You can ask about our features or request help with your account.",
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
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const result = await supportBotAction({
        message: currentInput,
        userName: user.displayName || 'Anonymous',
        userEmail: user.email || 'N/A',
      });

      if (result && result.response) {
        const assistantMessage: Message = { role: 'assistant', content: result.response };
        setMessages(prev => [...prev, assistantMessage]);

        // If the AI flagged this as a refund request, log it to Firestore for admin
        if (result.isRefundRequest && firestore) {
            await addDoc(collection(firestore, 'support_requests'), {
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userEmail: user.email || 'N/A',
                message: currentInput,
                type: 'refund',
                reason: result.refundReason || 'No specific reason provided.',
                status: 'pending',
                createdAt: Date.now(),
            });
            toast({
                title: "Refund Request Logged",
                description: "An admin has been notified and will verify your request shortly.",
            });
        }
      } else {
        throw new Error('The AI support agent did not respond.');
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to connect to support.',
      });
      setMessages(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="QuizNova Support" />
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <Card className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full">
           <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                    <LifeBuoy className="h-6 w-6 text-blue-600" />
                    Support Chat
                </CardTitle>
                <CardDescription>
                    Ask Nova Support about app features or billing issues.
                </CardDescription>
            </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-muted/5">
             <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex flex-col gap-2", message.role === 'user' ? 'items-end' : 'items-start')}>
                    <div className={cn("flex items-start gap-3", message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={cn(message.role === 'assistant' ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600")}>
                                {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "max-w-[80%] rounded-2xl p-3 text-sm shadow-sm", 
                            message.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'
                        )}>
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>
                    </div>
                  </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-600 text-white"><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-white border rounded-2xl p-3 rounded-tl-none shadow-sm">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        </div>
                    </div>
                 )}
              </div>
            </ScrollArea>

            <div className="border-t p-4 bg-white">
              <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-3xl mx-auto">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 resize-none min-h-[44px] max-h-[120px] rounded-xl border-slate-200 focus:ring-blue-500"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700" disabled={isLoading || !input.trim()}>
                   {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase font-bold tracking-widest">
                Support is powered by Nova AI
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
