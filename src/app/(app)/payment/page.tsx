
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const plansDetails = {
  premium: {
    name: 'Premium Plan',
    price: '₹500',
    priceDescription: '/ month',
    amount: '500',
  },
  ultimate: {
    name: 'Ultimate Plan',
    price: '₹1000',
    priceDescription: '/ month',
    amount: '1000',
  },
};

const UPI_ID = '8638366294@fam';

function PaymentPageContents() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const plan = searchParams.get('plan') as keyof typeof plansDetails;

  const selectedPlan = plansDetails[plan] || { name: 'Plan', price: '₹---', amount: '0' };
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${UPI_ID}&pn=QuizNova&am=${selectedPlan.amount}&cu=INR`;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      description: text,
    });
  };

  return (
    <div className="flex flex-col">
      <Header title="Complete Your Purchase" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
        </Button>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">You've selected the <span className="text-primary">{selectedPlan.name}</span></CardTitle>
              <CardDescription>
                Complete the payment of <span className="font-bold text-foreground">{selectedPlan.price}</span> to activate your subscription.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upi" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upi">UPI / QR Code</TabsTrigger>
                  <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                </TabsList>
                <TabsContent value="upi" className="mt-6">
                  <div className="flex flex-col items-center text-center">
                    <p className="mb-4 text-muted-foreground">Scan the QR code with your UPI app.</p>
                    <Image 
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      width={200}
                      height={200}
                    />
                     <p className="my-4 text-muted-foreground">Or pay using the UPI ID below:</p>
                     <div 
                        className="flex items-center gap-2 rounded-lg bg-muted p-3 cursor-pointer hover:bg-accent"
                        onClick={() => copyToClipboard(UPI_ID)}
                    >
                       <span className="font-mono text-lg">{UPI_ID}</span>
                       <Copy className="h-4 w-4" />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="bank" className="mt-6">
                    <div className="space-y-4">
                        <p className="text-muted-foreground">Transfer the amount to the following bank account:</p>
                        <div className="rounded-lg border p-4 space-y-3">
                           <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Account Name:</span>
                                <span className="font-semibold">QuizNova EduTech</span>
                           </div>
                           <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Account Number:</span>
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => copyToClipboard('123456789012')}>
                                    <span className="font-mono">123456789012</span>
                                    <Copy className="h-4 w-4" />
                                </div>
                           </div>
                           <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">IFSC Code:</span>
                                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => copyToClipboard('QUIZ0001234')}>
                                    <span className="font-mono">QUIZ0001234</span>
                                    <Copy className="h-4 w-4" />
                                </div>
                           </div>
                           <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Bank Name:</span>
                                <span className="font-semibold">Learners Bank of India</span>
                           </div>
                        </div>
                    </div>
                </TabsContent>
              </Tabs>
              <Button className="w-full mt-8" onClick={() => router.push('/dashboard')}>I have completed the payment</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentPageContents />
        </Suspense>
    )
}
