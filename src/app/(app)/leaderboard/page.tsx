'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Target, Swords, Loader2, Sparkles } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const router = useRouter();

  const leaderboardQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('points', 'desc'), limit(50)) : null),
    [firestore]
  );

  const { data: topUsers, isLoading } = useCollection<UserProfile>(leaderboardQuery);

  const handleChallenge = (userName: string) => {
    router.push(`/challenge/create?friend=${encodeURIComponent(userName)}`);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 1) return <Medal className="h-6 w-6 text-slate-400" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-orange-600" />;
    return <span className="font-black text-slate-400 text-sm">{rank + 1}</span>;
  };

  const getTierColor = (rankStr: string) => {
    switch (rankStr) {
        case 'Bronze': return 'bg-orange-100 text-orange-700';
        case 'Silver': return 'bg-slate-100 text-slate-700';
        case 'Gold': return 'bg-amber-100 text-amber-700';
        case 'Platinum': return 'bg-cyan-100 text-cyan-700';
        case 'Diamond': return 'bg-indigo-100 text-indigo-700';
        default: return 'bg-muted text-muted-foreground';
    }
  }

  return (
    <div className="flex flex-col bg-muted/20 min-h-screen">
      <Header title="Global Leaderboard" />
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Top 3 Section */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pb-4 pt-4">
            {topUsers && topUsers.length >= 2 && (
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-16 w-16 md:h-24 md:w-24 border-4 border-slate-300 shadow-lg">
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-black text-xl">{topUsers[1].name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-slate-300 text-white rounded-full p-1.5 shadow-md">
                            <Medal className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-black text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{topUsers[1].name.split(' ')[0]}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{topUsers[1].points} Aura</p>
                    </div>
                </div>
            )}

            {topUsers && topUsers.length >= 1 && (
                <div className="flex flex-col items-center gap-4 scale-110 mb-4">
                    <div className="relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
                        </div>
                        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-yellow-400 shadow-2xl ring-4 ring-yellow-400/20">
                            <AvatarFallback className="bg-yellow-50 text-yellow-700 font-black text-3xl">{topUsers[0].name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white rounded-full p-2 shadow-md">
                            <Trophy className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-black text-sm md:text-lg truncate max-w-[100px] md:max-w-none">{topUsers[0].name.split(' ')[0]}</p>
                        <p className="text-xs font-black text-yellow-600 uppercase tracking-widest">{topUsers[0].points} Aura</p>
                    </div>
                </div>
            )}

            {topUsers && topUsers.length >= 3 && (
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-orange-400 shadow-lg">
                            <AvatarFallback className="bg-orange-50 text-orange-700 font-black text-xl">{topUsers[2].name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-orange-400 text-white rounded-full p-1.5 shadow-md">
                            <Medal className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-black text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{topUsers[2].name.split(' ')[0]}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{topUsers[2].points} Aura</p>
                    </div>
                </div>
            )}
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white py-6">
            <CardTitle className="flex items-center gap-2 text-xl uppercase tracking-tighter font-black">
                <Target className="h-6 w-6 text-indigo-400" />
                Top Students Rank
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Compete with your peers and climb the ranks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="divide-y">
                {topUsers?.map((userProfile, index) => (
                  <div key={userProfile.id} className={cn("flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors", index < 3 && "bg-indigo-50/20")}>
                    <div className="w-10 flex justify-center shrink-0">
                      {getRankBadge(index)}
                    </div>
                    <Avatar className="h-10 w-10 shrink-0 border border-slate-200">
                      <AvatarFallback className="font-bold text-slate-600">{userProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-900 truncate">{userProfile.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={cn("text-[8px] font-black uppercase px-1.5 py-0", getTierColor(userProfile.rank))}>
                            {userProfile.rank || 'Bronze'}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{userProfile.streak || 0} Day Streak</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div className="mr-2">
                        <p className="text-sm font-black text-indigo-600">{userProfile.points?.toLocaleString() || 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Aura Points</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-indigo-100 hover:text-indigo-600 group" onClick={() => handleChallenge(userProfile.name)}>
                        <Swords className="h-5 w-5 transition-transform group-hover:scale-110" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}