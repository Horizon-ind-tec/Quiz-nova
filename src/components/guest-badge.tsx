'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const GUEST_DURATION_MS = 30 * 60 * 1000; // 30 minutes for guest session

export function GuestBadge() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [timeLeftPercent, setTimeLeftPercent] = useState(100);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!user?.isAnonymous) return;

    const startTime = parseInt(localStorage.getItem('guestStartTime') || Date.now().toString());
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = GUEST_DURATION_MS - elapsed;
      const percent = Math.max(0, (remaining / GUEST_DURATION_MS) * 100);
      
      setTimeLeftPercent(percent);

      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    };

    const interval = setInterval(updateTimer, 1000);
    updateTimer(); // initial run

    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    localStorage.removeItem('guestStartTime');
    await signOut(auth);
    router.push('/signup');
  };

  if (!user?.isAnonymous) return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center justify-center cursor-help group px-1">
            <div className="relative h-8 w-8 flex items-center justify-center">
              {/* Heart SVG with draining effect */}
              <svg 
                viewBox="0 0 32 32" 
                className="h-full w-full drop-shadow-sm"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <clipPath id="heart-clip">
                    <path d="M16 28.5L14.1 27.15C7.4 21.05 3 17.05 3 12.15C3 8.15 6.15 5 10.15 5C12.45 5 14.65 6.05 16 7.7C17.35 6.05 19.55 5 21.85 5C25.85 5 29 8.15 29 12.15C29 17.05 24.6 21.05 17.9 27.15L16 28.5Z" />
                  </clipPath>
                </defs>
                
                {/* Background empty heart */}
                <path 
                  d="M16 28.5L14.1 27.15C7.4 21.05 3 17.05 3 12.15C3 8.15 6.15 5 10.15 5C12.45 5 14.65 6.05 16 7.7C17.35 6.05 19.55 5 21.85 5C25.85 5 29 8.15 29 12.15C29 17.05 24.6 21.05 17.9 27.15L16 28.5Z" 
                  className="fill-muted stroke-muted-foreground stroke-1" 
                />
                
                {/* Liquid filling */}
                <g clipPath="url(#heart-clip)">
                  <rect 
                    x="0" 
                    y={32 - (timeLeftPercent * 32 / 100)} 
                    width="32" 
                    height="32" 
                    className="fill-red-500 transition-all duration-1000 ease-linear"
                  />
                </g>

                {/* Heart outline */}
                <path 
                  d="M16 28.5L14.1 27.15C7.4 21.05 3 17.05 3 12.15C3 8.15 6.15 5 10.15 5C12.45 5 14.65 6.05 16 7.7C17.35 6.05 19.55 5 21.85 5C25.85 5 29 8.15 29 12.15C29 17.05 24.6 21.05 17.9 27.15L16 28.5Z" 
                  className="stroke-red-600 stroke-[1.5] group-hover:stroke-red-700" 
                />
              </svg>
              
              {/* Glow effect when low */}
              {timeLeftPercent < 20 && (
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse -z-10 blur-md" />
              )}
            </div>
            <span className="text-[7px] font-bold text-red-600 mt-0.5 leading-none uppercase text-center max-w-[60px] whitespace-pre-wrap">Guest access remaining</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-bold">Guest Mode: {Math.ceil(timeLeftPercent)}% time left</p>
        </TooltipContent>
      </Tooltip>

      <AlertDialog open={isExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <span className="text-2xl">⌛</span> Guest Session Expired
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground font-medium">
              Hey there, your time in the guest mode is over. Please sign up to enjoy the app for a lifetime!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSignOut} className="bg-primary hover:bg-primary/90 text-white font-bold w-full">
              Sign Up Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}