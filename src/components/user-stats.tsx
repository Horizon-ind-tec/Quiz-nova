'use client';

import { Flame, Trophy, Award, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getAuraStatus } from '@/lib/data';

interface UserStatsProps {
  profile: UserProfile | null;
}

const RANK_CONFIG = {
  Beginner: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  Intermediate: { color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' },
  Advanced: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  Elite: { color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  Secret: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

export function UserStats({ profile }: UserStatsProps) {
  if (!profile) return null;

  const { level, rank, min, nextMin, isMax } = getAuraStatus(profile.points || 0);
  const config = RANK_CONFIG[rank] || RANK_CONFIG.Beginner;
  
  const currentLevelProgressPoints = profile.points - min;
  const levelRangePoints = nextMin - min;
  const progress = isMax ? 100 : Math.min(100, (currentLevelProgressPoints / levelRangePoints) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Streak Card */}
      <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-orange-500 to-red-600 text-white">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Daily Streak</p>
            <h3 className="text-3xl font-black">{profile.streak || 0} Days</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <Flame className={cn("h-8 w-8", profile.streak > 0 && "animate-pulse")} />
          </div>
        </CardContent>
      </Card>

      {/* Rank Card */}
      <Card className={cn("border-2 shadow-sm", config.bg, config.border)}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Level {level}</p>
                <div className="h-4 w-px bg-slate-300" />
                <p className={cn("text-xs font-black uppercase tracking-widest", config.color)}>{rank}</p>
            </div>
            <h3 className={cn("text-2xl font-black uppercase tracking-tighter", config.color)}>
              Ranked Student
            </h3>
          </div>
          <div className={cn("p-3 rounded-2xl", config.bg, "border", config.border)}>
            <Award className={cn("h-8 w-8", config.color)} />
          </div>
        </CardContent>
      </Card>

      {/* Points Card */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aura Points</p>
              <h3 className="text-xl font-black text-slate-900">{profile.points?.toLocaleString() || 0} XP</h3>
            </div>
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
              <span>Next Level Progress</span>
              <span>{isMax ? 'Max Level' : `${Math.round(progress)}%`}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
