'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrainCircuit, LayoutDashboard, PlusCircle, TrendingUp, MessageSquareHeart, Gem, BookUser } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useUser } from '@/firebase';

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';


export function SideNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (path: string) => pathname.startsWith(path);
  const isUserAdmin = user?.email === ADMIN_EMAIL;


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
              isActive={isActive('/plans')}
              tooltip={{ children: 'Upgrade' }}
            >
              <Link href="/plans">
                <Gem />
                <span>Upgrade</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
