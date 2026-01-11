'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { Header } from '@/components/header';
import { VideoLibrary } from '@/components/video-library';
import { AdminVideoManager } from '@/components/admin-video-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

export default function CoachingPage() {
  const { user, loading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isUserAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="flex flex-col">
      <Header title="Video Coaching" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        {isUserAdmin ? (
          <Tabs defaultValue="library">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library">Student View</TabsTrigger>
              <TabsTrigger value="admin">Admin Panel</TabsTrigger>
            </TabsList>
            <TabsContent value="library">
              <VideoLibrary />
            </TabsContent>
            <TabsContent value="admin">
              <AdminVideoManager />
            </TabsContent>
          </Tabs>
        ) : (
          <VideoLibrary />
        )}
      </main>
    </div>
  );
}
