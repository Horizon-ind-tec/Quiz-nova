
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, Hourglass } from 'lucide-react';
import { Header } from '@/components/header';

export default function PaymentConfirmationPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col">
       <Header title="Payment Confirmation" />
       <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
             <div className="mx-auto bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center">
                <Hourglass className="h-8 w-8" />
             </div>
            <CardTitle className="mt-4 text-2xl">Verification in Progress</CardTitle>
            <CardDescription className="text-base">
              Thank you for your payment! Your upgrade is currently being verified by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
                <p className="flex items-start justify-center gap-2 text-muted-foreground">
                    <MailCheck className="h-5 w-5 mt-0.5 shrink-0" />
                    <span>You will receive an email and your account will be upgraded as soon as the payment is confirmed. This usually takes just a few minutes.</span>
                </p>
            </div>
            <Button className="mt-6 w-full" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    