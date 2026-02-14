'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Sparkles, Swords, Copy, Check, Hash, Target, HelpCircle } from 'lucide-react';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { generateQuizAction } from '@/app/actions';
import { SUBJECTS_DATA, CLASSES } from '@/lib/data';
import type { Quiz, Challenge } from '@/lib/types';

const formSchema = z.object({
  subject: z.string().min(1, 'Please select a subject.'),
  class: z.string().min(1, 'Please select a class.'),
  chapter: z.string().min(1, 'Chapter is required.'),
  totalMarks: z.coerce.number().min(5, 'Minimum 5 marks required.').max(100, 'Maximum 100 marks allowed.'),
  numberOfQuestions: z.coerce.number().min(1, 'At least 1 question required.').max(50, 'Maximum 50 questions allowed.'),
});

// Helper to generate a branded random ID (This is the "Room Code")
const generateChallengeId = (length: number = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function CreateChallengePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetFriend = searchParams.get('friend') || 'a Friend';

  const [isLoading, setIsLoading] = useState(false);
  const [challengeLink, setChallengeLink] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      subject: '', 
      class: '', 
      chapter: '',
      totalMarks: 20,
      numberOfQuestions: 5
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
      const result = await generateQuizAction({
        ...values,
        difficulty: 'medium',
        quizType: 'quiz',
      });

      const challengeId = generateChallengeId();
      
      const newQuiz: Quiz = {
        id: challengeId,
        ...values,
        difficulty: 'medium',
        quizType: 'quiz',
        questions: result.questions,
        createdAt: Date.now(),
      };

      const challenge: Challenge = {
        id: challengeId,
        creatorId: user.uid,
        creatorName: user.displayName || 'Nova Student',
        creatorScore: null,
        friendId: null,
        friendName: targetFriend,
        friendScore: null,
        quiz: newQuiz,
        status: 'pending',
        createdAt: Date.now(),
      };

      await setDoc(doc(firestore, 'challenges', challengeId), challenge);

      const fullUrl = `${window.location.origin}/Quiznova.Challenge/${challengeId}`;
      setChallengeLink(fullUrl);
      setRoomCode(challengeId);
      
      toast({ title: 'Duel Created!', description: 'Room code is ready to share.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to create duel', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied!' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Header title="Create Challenge" />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-indigo-600">
          <CardHeader className="text-center">
            <div className="mx-auto bg-indigo-100 p-3 rounded-2xl w-fit mb-2">
                <Swords className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter">New Duel</CardTitle>
            <CardDescription>Challenge {targetFriend} to an AI quiz battle.</CardDescription>
          </CardHeader>
          <CardContent>
            {!challengeLink ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    name="subject"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {SUBJECTS_DATA.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="class"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="chapter"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter/Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Algebra, Botany" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      name="totalMarks"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Target className="h-3 w-3 text-indigo-600" /> Total Marks
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="numberOfQuestions"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <HelpCircle className="h-3 w-3 text-indigo-600" /> Questions
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-black uppercase tracking-widest mt-4" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    {isLoading ? 'Preparing Duel...' : 'Generate Battle'}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Duel Room Code</p>
                    <div className="bg-white border-2 border-indigo-100 rounded-xl p-4 mb-4 flex items-center justify-between">
                        <span className="text-2xl font-black tracking-widest text-slate-900 uppercase font-mono">{roomCode}</span>
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(roomCode || '')} className="text-indigo-600 hover:bg-indigo-50">
                            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        </Button>
                    </div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight mb-6 text-left">Your friend can enter this code in the "Join Room" menu to start the duel.</p>
                    
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Or share link</p>
                        <Button onClick={() => copyToClipboard(challengeLink || '')} variant="outline" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-100 font-bold h-10 text-xs">
                            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                            COPY DUEL LINK
                        </Button>
                    </div>
                </div>
                <div className="space-y-3">
                    <Button onClick={() => router.push('/dashboard')} className="w-full h-12 bg-slate-900 font-black uppercase tracking-tight rounded-xl">
                        Return to Dashboard
                    </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
