'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, Swords, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Challenge, Quiz } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { generateQuizAction } from '@/app/actions';

export default function ChallengeInvitePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [, setQuiz] = useLocalStorage<any | null>('currentQuiz', null);
  const [, setChallengeMode] = useLocalStorage<string | null>('currentChallengeId', null);

  const challengeRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'challenges', id as string) : null),
    [firestore, id]
  );
  const { data: challenge, isLoading } = useDoc<Challenge>(challengeRef);

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (challenge && challenge.status === 'completed') {
        router.push(`/Quiznova.Challenge/${id}/results`);
    }
  }, [challenge, router, id]);

  const handleAccept = async () => {
    if (!firestore || !challenge) return;

    if (!user) {
        toast({
            title: "Sign in Required",
            description: "Please sign in to accept the challenge and compete!",
        });
        router.push(`/?redirect=/Quiznova.Challenge/${id}`);
        return;
    }

    setIsProcessing(true);

    try {
        const isCreator = user.uid === challenge.creatorId;
        let activeQuiz: Quiz | undefined;

        if (isCreator) {
            activeQuiz = challenge.creatorQuiz;
        } else {
            // It's the friend joining. Check if they already have a quiz version.
            if (challenge.friendQuiz && challenge.friendId === user.uid) {
                activeQuiz = challenge.friendQuiz;
            } else {
                // Generate a FRESH unique quiz for the friend based on challenge params
                const result = await generateQuizAction({
                    subject: challenge.subject,
                    class: challenge.class,
                    chapter: challenge.chapter,
                    totalMarks: challenge.totalMarks,
                    numberOfQuestions: challenge.numberOfQuestions,
                    difficulty: challenge.difficulty,
                    quizType: 'quiz',
                });

                activeQuiz = {
                    id: challenge.id + '-friend',
                    subject: challenge.subject,
                    class: challenge.class,
                    chapter: challenge.chapter,
                    totalMarks: challenge.totalMarks,
                    difficulty: challenge.difficulty,
                    quizType: 'quiz',
                    questions: result.questions,
                    createdAt: Date.now(),
                };

                // Update challenge doc with friend info and their unique quiz
                await updateDoc(challengeRef!, {
                    friendId: user.uid,
                    friendName: user.displayName || 'Nova Student',
                    friendQuiz: activeQuiz,
                    status: 'accepted'
                });
            }
        }

        if (activeQuiz) {
            setQuiz(activeQuiz);
            setChallengeMode(challenge.id);
            router.push('/quiz/take');
        } else {
            throw new Error("Could not initialize battle quiz.");
        }

    } catch (e: any) {
        console.error("Accept error:", e);
        toast({
            variant: "destructive",
            title: "Access Denied",
            description: e.message || "You don't have permission to join this duel.",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  if (!challenge) {
    return (
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
            <h1 className="text-xl font-bold mb-2 text-slate-900">Duel Not Found</h1>
            <p className="text-muted-foreground mb-4">This challenge link might be expired or invalid.</p>
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
    );
  }

  const hasFinishedCreator = challenge.creatorScore !== null;
  const hasFinishedFriend = challenge.friendScore !== null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <Header title="Challenge Received" />
      <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
        
        <div className="relative w-full max-w-lg">
            <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full text-center shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="bg-indigo-600 p-4 rounded-full shadow-lg shadow-indigo-500/50">
                        <Swords className="h-10 w-10" />
                    </div>
                </div>

                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Quiz Duel!</h2>
                <p className="text-indigo-300 font-bold uppercase text-xs tracking-widest mb-8">Anti-Cheat Mode Active</p>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-indigo-500">
                            <AvatarFallback className="bg-indigo-900 text-white font-black">{challenge.creatorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-black truncate">{challenge.creatorName.split(' ')[0]}</p>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase">{hasFinishedCreator ? `Scored: ${challenge.creatorScore}` : 'READY'}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-amber-500">
                            <AvatarFallback className="bg-amber-900 text-white font-black">{challenge.friendName?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-black truncate">{challenge.friendName?.split(' ')[0] || 'Opponent'}</p>
                        <p className="text-[10px] text-amber-400 font-bold uppercase">{hasFinishedFriend ? `Scored: ${challenge.friendScore}` : 'WAITING'}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8 text-left bg-white/5 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        <p className="text-sm font-bold text-slate-300">Subject: <span className="text-white">{challenge.subject}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <p className="text-sm font-bold text-slate-300">Topic: <span className="text-white">{challenge.chapter || 'General'}</span></p>
                    </div>
                </div>

                <Button 
                    onClick={handleAccept} 
                    disabled={isProcessing} 
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
                >
                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : (user ? 'ACCEPT CHALLENGE' : 'LOGIN TO PLAY')}
                </Button>
                
                <p className="mt-6 text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                    Both students get different questions to prevent cheating.
                </p>
            </div>
        </div>

      </main>
    </div>
  );
}
