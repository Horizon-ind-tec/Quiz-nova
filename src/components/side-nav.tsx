'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrainCircuit, LayoutDashboard, PlusCircle, TrendingUp } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function SideNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

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
              isActive={isActive('/quiz/create')}
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
              isActive={isActive('/performance')}
              tooltip={{ children: 'Performance' }}
            >
              <Link href="/performance">
                <TrendingUp />
                <span>Performance</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
