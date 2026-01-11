
'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { notifyAdminOfPaymentAction } from '@/app/actions';

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
const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

function PaymentPageContents() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const plan = searchParams.get('plan') as keyof typeof plansDetails;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const selectedPlan = plansDetails[plan] || { name: 'Plan', price: '₹---', amount: '0' };
  
  const defaultQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${UPI_ID}&pn=QuizNova&am=${selectedPlan.amount}&cu=INR`;
  
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'upiDetails') : null),
    [firestore]
  );
  
  const { data: upiSettings, isLoading: settingsLoading } = useDoc<{ qrCodeUrl: string }>(settingsDocRef);

  const [qrCodeUrl, setQrCodeUrl] = useState(defaultQrCodeUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (upiSettings) {
      setQrCodeUrl(upiSettings.qrCodeUrl);
    } else {
      const initializeSettings = async () => {
        if (settingsDocRef) {
          const docSnap = await getDoc(settingsDocRef);
          if (!docSnap.exists() && user?.email === ADMIN_EMAIL) {
            await setDoc(settingsDocRef, { qrCodeUrl: defaultQrCodeUrl }, { merge: true });
          }
        }
      };
      if (user) {
        initializeSettings();
      }
      setQrCodeUrl(defaultQrCodeUrl);
    }
  }, [upiSettings, defaultQrCodeUrl, settingsDocRef, user]);
  

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      description: text,
    });
  };

  const handleQrCodeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && settingsDocRef) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const newQrCodeUrl = e.target.result as string;
          try {
            await setDoc(settingsDocRef, { qrCodeUrl: newQrCodeUrl }, { merge: true });
            setQrCodeUrl(newQrCodeUrl);
            toast({
              title: 'QR Code Updated',
              description: 'The new QR code has been saved successfully.',
            });
          } catch(error) {
            console.error("Error updating QR code:", error);
            toast({
              variant: 'destructive',
              title: 'Update Failed',
              description: (error as Error).message || 'Could not save the new QR code.',
            });
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangeQrClick = () => {
    fileInputRef.current?.click();
  };

  const handlePaymentConfirmation = async () => {
    if (!user || !firestore || !plan) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to make a payment.' });
      return;
    }
    
    setIsConfirming(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    
    try {
      // 1. Update Firestore document to set payment as pending
      await setDoc(userDocRef, {
        paymentStatus: 'pending',
        pendingPlan: plan,
      }, { merge: true });
      
      // 2. Trigger the admin notification flow (non-blocking)
      notifyAdminOfPaymentAction({
        userName: user.displayName || 'N/A',
        userEmail: user.email || 'N/A',
        planName: selectedPlan.name,
        planPrice: selectedPlan.price,
      }).catch(err => {
         // Log the error but don't block the user flow
         console.error("Failed to send admin notification:", err);
      });

      // 3. Redirect the user to the confirmation page
      router.push('/payment/confirmation');

    } catch (error) {
      console.error("Error setting payment status:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Could not initiate payment confirmation.'
      });
      setIsConfirming(false); // Only stop loading if there's an error
    }
  };

  if (userLoading || settingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isUserAdmin = user?.email === ADMIN_EMAIL;

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
                  <TabsTrigger value="upi">UPI</TabsTrigger>
                  <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                </TabsList>
                <TabsContent value="upi" className="mt-6">
                  <div className="flex flex-col items-center text-center">
                    <p className="mb-4 text-muted-foreground">Scan the QR code with your UPI app.</p>
                    <div className="relative w-[200px] h-[200px]">
                      { (settingsLoading || isUploading) && 
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      }
                      <Image 
                        src={qrCodeUrl}
                        alt="UPI QR Code"
                        width={200}
                        height={200}
                        className="rounded-md"
                        key={qrCodeUrl}
                      />
                    </div>
                    {isUserAdmin && (
                      <div className="mt-4">
                        <Button variant="outline" onClick={handleChangeQrClick} disabled={isUploading}>
                          <Upload className="mr-2 h-4 w-4" />
                          {isUploading ? 'Uploading...' : 'Change QR Code'}
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleQrCodeChange}
                          className="hidden"
                          accept="image/png, image/jpeg, image/gif"
                        />
                      </div>
                    )}
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
              <Button className="w-full mt-8" onClick={handlePaymentConfirmation} disabled={isConfirming}>
                {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isConfirming ? 'Processing...' : 'I have completed the payment'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PaymentPageContents />
    </Suspense>
  );
}
