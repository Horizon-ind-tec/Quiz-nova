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
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-lg font-semibold md:text-xl flex-1">{title}</h1>
       <div className="flex items-center gap-3">
            <GuestBadge />
            <div className="flex items-center gap-2">
                {renderPlanIcon()}
                <span className="text-sm font-medium hidden sm:inline-block">{user?.displayName}</span>
            </div>
       </div>
       <div className="flex items-center gap-1 sm:gap-2">
           <Button asChild variant="outline" size="icon" className="relative h-9 w-9">
               <Link href="/notifications">
                    <Bell className="h-4 w-4" />
                    {isUserAdmin && notificationCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{notificationCount}</Badge>
                    )}
               </Link>
           </Button>

           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/plans" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Plans & Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
       </div>
    </header>
  );
}
