'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
    const auth = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut(auth);
        router.push('/login');
    }

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-lg font-semibold md:text-xl flex-1">{title}</h1>
       <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
        </Button>
    </header>
  );
}
