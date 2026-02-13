'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrainCircuit, LayoutDashboard, PlusCircle, TrendingUp, MessageSquareHeart, Gem, BookUser, Shield, Bell, CalendarCheck, Target, GraduationCap, FileText } from 'lucide-react';
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

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarHeader className="p-4 mb-2">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1 shadow-sm">
              <BrainCircuit className="h-8 w-8 text-primary" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">QuizNova</span>
          </Link>
        </SidebarHeader>
        <SidebarMenu className="px-2 space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/dashboard')}
              tooltip={{ children: 'Dashboard' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-semibold">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/quiz')}
              tooltip={{ children: 'New Quiz' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/quiz/create">
                <PlusCircle className="h-5 w-5" />
                <span className="font-semibold">New Quiz</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/notes')}
              tooltip={{ children: 'Chapter Notes' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/notes">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Chapter Notes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/most-expected-questions')}
              tooltip={{ children: 'Most Expected' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/most-expected-questions">
                <Target className="h-5 w-5" />
                <span className="font-semibold">Most Expected</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/helper')}
              tooltip={{ children: 'Homework Helper' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/helper">
                <GraduationCap className="h-5 w-5" />
                <span className="font-semibold">Homework Helper</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/report')}
              tooltip={{ children: 'AI Report' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/report">
                <MessageSquareHeart className="h-5 w-5" />
                <span className="font-semibold">AI Report</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/coaching')}
              tooltip={{ children: 'Coaching' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/coaching">
                <BookUser className="h-5 w-5" />
                <span className="font-semibold">Coaching</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/performance')}
              tooltip={{ children: 'Performance' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/performance">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Performance</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/study-plan')}
              tooltip={{ children: 'Study Plan' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/study-plan">
                <CalendarCheck className="h-5 w-5" />
                <span className="font-semibold">Study Plan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={isActive('/plans')}
              tooltip={{ children: 'Upgrade' }}
              className="rounded-xl transition-colors"
            >
              <Link href="/plans">
                <Gem className="h-5 w-5" />
                <span className="font-semibold">Upgrade</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           {isUserAdmin && (
            <SidebarMenuItem className="mt-4 pt-4 border-t border-sidebar-border/50">
                    <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive('/notifications')}
                    tooltip={{ children: 'Admin Panel' }}
                    className="rounded-xl transition-colors bg-sidebar-accent/20"
                    >
                    <Link href="/notifications">
                        <Shield className="h-5 w-5" />
                        <span className="font-semibold">Admin Panel</span>
                        {notificationCount > 0 && <SidebarMenuBadge className="bg-red-500 text-white font-bold">{notificationCount}</SidebarMenuBadge>}
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
