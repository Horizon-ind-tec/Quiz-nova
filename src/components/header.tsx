'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Gem, ShieldCheck, Bell, MoreVertical, User, CreditCard, HelpCircle } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { UserProfile } from '@/lib/types';
import { doc, collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { GuestBadge } from '@/components/guest-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface HeaderProps {
  title: string;
}

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';


export function Header({ title }: HeaderProps) {
    const auth = useAuth();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const isUserAdmin = user?.email === ADMIN_EMAIL;

    const userProfileRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
      [firestore, user]
    );
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const pendingUsersQuery = useMemoFirebase(
        () => (firestore && isUserAdmin ? query(collection(firestore, 'users'), where('paymentStatus', '==', 'pending')) : null),
        [firestore, isUserAdmin]
    );
    const { data: pendingUsers } = useCollection<UserProfile>(pendingUsersQuery);
    const notificationCount = (pendingUsers?.length || 0);

    const handleSignOut = async () => {
        localStorage.removeItem('guestStartTime');
        await signOut(auth);
        router.push('/');
    }
    
    const renderPlanIcon = () => {
        if (!userProfile) return null;

        if (userProfile.plan === 'premium') {
            return <Gem className="h-4 w-4 text-yellow-400" />;
        }
        if (userProfile.plan === 'ultimate') {
            return <ShieldCheck className="h-4 w-4 text-blue-500" />;
        }
        return null;
    }

  return (
    <header className="flex h-14 md:h-16 items-center gap-3 border-b bg-card px-3 md:px-6 sticky top-0 z-30 shadow-sm">
      <div className="md:hidden">
        <SidebarTrigger className="h-9 w-9" />
      </div>
      <h1 className="text-sm md:text-xl font-black truncate flex-1 tracking-tight text-slate-900 uppercase">
        {title}
      </h1>
       <div className="flex items-center gap-2">
            <GuestBadge />
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg border border-slate-100 hidden sm:flex">
                {renderPlanIcon()}
                <span className="text-xs font-bold truncate max-w-[100px]">{user?.displayName}</span>
            </div>
       </div>
       <div className="flex items-center gap-1 sm:gap-2">
           <Button asChild variant="outline" size="icon" className="relative h-9 w-9 rounded-full border-slate-200">
               <Link href="/notifications">
                    <Bell className="h-4 w-4 text-slate-600" />
                    {isUserAdmin && notificationCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-[10px] bg-red-600 border-2 border-white">{notificationCount}</Badge>
                    )}
               </Link>
           </Button>

           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <MoreVertical className="h-4 w-4 text-slate-600" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100">
                <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer py-3">
                    <User className="mr-2 h-4 w-4" />
                    <span className="font-semibold">Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/plans" className="cursor-pointer py-3">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="font-semibold">Plans & Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support" className="cursor-pointer py-3">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span className="font-semibold">Support</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer py-3">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-bold">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
       </div>
    </header>
  );
}
