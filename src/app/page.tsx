'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BrainCircuit, Loader2, Bot, ArrowRight, LogOut } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User, 
  signInAnonymously,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

export default function RootPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user: existingUser, isUserLoading } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const syncUserProfile = async (user: User) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    
    const isAdmin = user.email === ADMIN_EMAIL;
    const isGuest = user.isAnonymous;
    const defaultPlan = isAdmin ? 'ultimate' : 'free';

    try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
            await setDoc(userDocRef, {
                id: user.uid,
                email: user.email || 'guest@quiznova.ai',
                name: user.displayName || (isGuest ? 'AI Guest' : 'New User'),
                createdAt: new Date().toISOString(),
                plan: defaultPlan,
                points: 0,
                streak: 0,
                rank: 'Bronze',
            });
        } else if (isAdmin) {
            await setDoc(userDocRef, { plan: 'ultimate' }, { merge: true });
        }
    } catch (e) {
        console.error("Profile sync error:", e);
    }

    if (isGuest) {
      localStorage.setItem('guestStartTime', Date.now().toString());
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await syncUserProfile(userCredential.user);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Incorrect email or password. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      await syncUserProfile(userCredential.user);
      router.push('/dashboard');
    } catch (error: any) {
      const description = error.code === 'auth/operation-not-allowed'
        ? 'Google Sign-In is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.'
        : error.message || 'Could not sign in with Google.';
      
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description,
      });
      setIsGoogleLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsGuestLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      await syncUserProfile(userCredential.user);
      router.push('/dashboard');
    } catch (error: any) {
      const description = error.code === 'auth/operation-not-allowed'
        ? 'Anonymous Sign-In is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.'
        : error.message || 'Could not sign in as guest.';

      toast({
        variant: 'destructive',
        title: 'Guest Login Failed',
        description,
      });
      setIsGuestLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('guestStartTime');
    toast({ title: "Signed Out", description: "You can now log in with a different account." });
  }

  if (isUserLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  if (existingUser) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-xl border-none text-center">
                <CardHeader>
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BrainCircuit className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-black">Welcome Back!</CardTitle>
                    <CardDescription>You are currently signed in as <span className="font-bold text-foreground">{existingUser.displayName || existingUser.email}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button onClick={() => router.push('/dashboard')} className="w-full h-12 text-lg font-bold">
                        Continue to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button variant="ghost" onClick={handleSignOut} className="w-full text-muted-foreground hover:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" /> Sign out to use another account
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center pb-2">
           <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="h-10 w-10 text-primary" />
           </div>
          <CardTitle className="text-3xl font-black tracking-tight">QuizNova</CardTitle>
          <CardDescription className="text-base">Sign in to your AI learning ecosystem.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="name@example.com" 
                        type="email"
                        autoComplete="email"
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Button 
                            type="button" 
                            variant="link" 
                            className="px-0 font-bold text-xs" 
                            onClick={async () => {
                                const email = form.getValues('email');
                                if (!email) return toast({ variant: "destructive", title: "Email required" });
                                try {
                                    await sendPasswordResetEmail(auth, email);
                                    toast({ title: "Reset Link Sent" });
                                } catch (e: any) {
                                    toast({ variant: "destructive", title: "Error", description: e.message });
                                }
                            }}
                        >
                            Forgot Password?
                        </Button>
                    </div>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        autoComplete="current-password"
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Sign In
              </Button>
            </form>
          </Form>

           <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-semibold">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="h-12 text-base font-semibold border-2" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
                    <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 58.2l-67.4 66.2C324.5 98.4 289.3 80 248 80c-82.3 0-149.3 66.9-149.3 148.7s67 148.7 149.3 148.7c97.1 0 131.3-72.8 135.2-109.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
                    </svg>}
                    Google
                </Button>

                <Button variant="ghost" className="h-12 text-muted-foreground hover:bg-slate-100" onClick={handleGuestSignIn} disabled={isGuestLoading}>
                    {isGuestLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bot className="mr-2 h-5 w-5" />}
                    Register as AI Guest (Test Mode)
                </Button>
            </div>


          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
