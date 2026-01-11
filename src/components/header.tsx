'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Gem, ShieldCheck } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';


interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
    const auth = useAuth();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
    );
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    }
    
    const renderPlanIcon = () => {
        if (!userProfile) return null;

        if (userProfile.plan === 'premium') {
            return <Gem className="h-4 w-4 text-yellow-500" />;
        }
        if (userProfile.plan === 'ultimate') {
            return <ShieldCheck className="h-4 w-4 text-blue-500" />;
        }
        return null;
    }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-lg font-semibold md:text-xl flex-1">{title}</h1>
       <div className="flex items-center gap-2">
            {renderPlanIcon()}
            <span className="text-sm font-medium">{user?.displayName}</span>
       </div>
       <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
        </Button>
    </header>
  );
}

