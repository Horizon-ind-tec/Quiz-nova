'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Sparkles, Swords, Copy, Check, Share2 } from 'lucide-react';

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
});

export default function CreateChallengePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetFriend = searchParams.get('friend') || 'a Friend';

  const [isLoading, setIsLoading] = useState(false);
  const [challengeLink, setChallengeLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: '', class: '', chapter: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
      // 1. Generate the Quiz using Nova AI
      const result = await generateQuizAction({
        ...values,
        difficulty: 'medium',
        totalMarks: 20,
        numberOfQuestions: 5,
        quizType: 'quiz',
      });

      const newQuiz: Quiz = {
        id: uuidv4(),
        ...values,
        difficulty: 'medium',
        quizType: 'quiz',
        totalMarks: 20,
        questions: result.questions,
        createdAt: Date.now(),
      };

      // 2. Create the Challenge document
      const challengeId = uuidv4();
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

      const link = `${window.location.origin}/challenge/${challengeId}`;
      setChallengeLink(link);
      toast({ title: 'Challenge Created!', description: 'Send the link to your friend to start the duel.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to create challenge', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!challengeLink) return;
    navigator.clipboard.writeText(challengeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link Copied!' });
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
            <CardDescription>Challenge {targetFriend} to an AI-powered quiz battle.</CardDescription>
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
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-black uppercase tracking-widest mt-4" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    {isLoading ? 'Preparing Duel...' : 'Generate Challenge'}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl">
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">Duel Link Generated</p>
                    <p className="text-[10px] text-muted-foreground break-all mb-4">{challengeLink}</p>
                    <Button onClick={copyToClipboard} variant="outline" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-100 font-bold">
                        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy Link'}
                    </Button>
                </div>
                <div className="space-y-3">
                    <p className="text-sm font-bold text-muted-foreground">Send this link to your friend. Once they accept, the duel begins!</p>
                    <Button onClick={() => router.push('/dashboard')} className="w-full h-12 bg-slate-900 font-black uppercase tracking-tight">
                        Done
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
