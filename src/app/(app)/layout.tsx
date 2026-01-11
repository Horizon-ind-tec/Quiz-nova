import { SideNav } from '@/components/side-nav';
import { SidebarProvider } from '@/components/ui/sidebar';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <SideNav />
          <main className="flex-1">{children}</main>
        </div>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}
