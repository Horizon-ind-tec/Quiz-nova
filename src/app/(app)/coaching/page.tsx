'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookUser } from 'lucide-react';

export default function CoachingPage() {
  return (
    <div className="flex flex-col">
      <Header title="Coaching" />
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <Card className="max-w-md w-full">
          <CardHeader className="items-center text-center">
            <BookUser className="h-12 w-12 text-primary" />
            <CardTitle className="text-2xl mt-4">Coaching Feature Coming Soon!</CardTitle>
            <CardDescription>
              We're working hard to bring you personalized coaching to help you reach your learning goals. Stay tuned!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground text-sm">
                This new section will offer one-on-one guidance, tailored study plans, and expert support.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
