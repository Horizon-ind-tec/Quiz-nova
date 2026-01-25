'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrainCircuit, LayoutDashboard, PlusCircle, TrendingUp, MessageSquareHeart, Gem, BookUser, Shield, Bell, CalendarCheck, Target } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge
} from '@/components/ui/sidebar';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';


export function SideNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const isUserAdmin = user?.email === ADMIN_EMAIL;

  const pendingUsersQuery = useMemoFirebase(
    () => (firestore && isUserAdmin ? query(collection(firestore, 'users'), where('paymentStatus', '==', 'pending')) : null),
    [firestore, isUserAdmin]
  );
  
  const { data: pendingUsers } = useCollection<UserProfile>(pendingUsersQuery);
  const notificationCount = pendingUsers?.length || 0;

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold">QuizNova</span>
          </Link>
        </SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/dashboard')}
              tooltip={{ children: 'Dashboard' }}
            >
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/quiz')}
              tooltip={{ children: 'New Quiz' }}
            >
              <Link href="/quiz/create">
                <PlusCircle />
                <span>New Quiz</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/most-expected-questions')}
              tooltip={{ children: 'Most Expected' }}
            >
              <Link href="/most-expected-questions">
                <Target />
                <span>Most Expected</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/report')}
              tooltip={{ children: 'AI Report' }}
            >
              <Link href="/report">
                <MessageSquareHeart />
                <span>AI Report</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/coaching')}
              tooltip={{ children: 'Coaching' }}
            >
              <Link href="/coaching">
                <BookUser />
                <span>Coaching</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/performance')}
              tooltip={{ children: 'Performance' }}
            >
              <Link href="/performance">
                <TrendingUp />
                <span>Performance</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/study-plan')}
              tooltip={{ children: 'Study Plan' }}
            >
              <Link href="/study-plan">
                <CalendarCheck />
                <span>Study Plan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/plans')}
              tooltip={{ children: 'Upgrade' }}
            >
              <Link href="/plans">
                <Gem />
                <span>Upgrade</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           {isUserAdmin && (
            <SidebarMenuItem>
                    <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive('/notifications')}
                    tooltip={{ children: 'Admin Panel' }}
                    >
                    <Link href="/notifications">
                        <Shield />
                        <span>Admin Panel</span>
                        {notificationCount > 0 && <SidebarMenuBadge>{notificationCount}</SidebarMenuBadge>}
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
