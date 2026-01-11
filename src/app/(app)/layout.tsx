
import { SideNav } from '@/components/side-nav';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <SideNav />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </SidebarProvider>
  );
}
