'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Trophy, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Challenge } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ChallengeResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();

  const challengeRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'challenges', id as string) : null),
    [firestore, id]
  );
  const { data: challenge, isLoading } = useDoc<Challenge>(challengeRef);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!challenge || challenge.status !== 'completed') {
    return (
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h1 className="text-xl font-bold mb-2">Waiting for duel to finish...</h1>
            <p className="text-muted-foreground mb-6">Both players must submit their answers to see the winner.</p>
            <Button onClick={() => router.push('/dashboard')}>Back to Home</Button>
        </div>
    );
  }

  const creatorScore = challenge.creatorScore || 0;
  const friendScore = challenge.friendScore || 0;
  
  const isDraw = creatorScore === friendScore;
  const winnerName = creatorScore > friendScore ? challenge.creatorName : challenge.friendName;
  const winnerScore = creatorScore > friendScore ? creatorScore : friendScore;
  const winnerInitial = winnerName?.charAt(0) || 'W';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header title="Duel Results" />
      <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
        
        <div className="text-center space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Battle Over!</h2>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Global Challenge Results</p>
        </div>

        {/* Winner Podium */}
        <div className="relative w-full max-w-lg">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <PartyPopper className="h-12 w-12 text-yellow-500 animate-bounce" />
            </div>
            
            <Card className="border-none shadow-2xl overflow-hidden rounded-3xl bg-white">
                <CardHeader className="bg-indigo-600 text-white text-center py-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative mb-4">
                            <Avatar className="h-24 w-24 border-4 border-yellow-400 shadow-2xl">
                                <AvatarFallback className="bg-white text-indigo-600 text-3xl font-black">{isDraw ? 'D' : winnerInitial}</AvatarFallback>
                            </Avatar>
                            {!isDraw && <div className="absolute -top-4 -right-4 text-4xl">👑</div>}
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">
                            {isDraw ? "IT'S A DRAW!" : winnerName}
                        </h3>
                        <p className="text-indigo-200 font-bold uppercase text-[10px] tracking-widest mt-1">
                            {isDraw ? "PERFECT MATCH" : "THE WINNER!"}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 divide-x border-b">
                        <div className="p-8 text-center space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{challenge.creatorName.split(' ')[0]}</p>
                            <p className="text-3xl font-black text-slate-900">{creatorScore}%</p>
                        </div>
                        <div className="p-8 text-center space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{challenge.friendName?.split(' ')[0] || 'Friend'}</p>
                            <p className="text-3xl font-black text-slate-900">{friendScore}%</p>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Trophy className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase leading-none">{challenge.subject}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">{challenge.chapter}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-indigo-600">+{Math.max(creatorScore, friendScore)} XP</p>
                                <p className="text-[8px] text-muted-foreground font-bold uppercase">Reward</p>
                            </div>
                        </div>

                        <Button onClick={() => router.push('/dashboard')} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-lg font-black uppercase tracking-tight rounded-2xl">
                            Return to Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>

      </main>
    </div>
  );
}
