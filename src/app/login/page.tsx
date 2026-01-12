'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const ALLOWED_DOMAINS = ['nova.com', 'edito.com'];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const domain = values.email.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Only users with a @nova.com or @edito.com email can log in.',
        });
        setIsLoading(false);
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unknown error occurred.',
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      const email = userCredential.user.email;
      const domain = email?.split('@')[1];

      if (!email || !domain || !ALLOWED_DOMAINS.includes(domain)) {
        await userCredential.user.delete();
        toast({
            variant: 'destructive',
            title: 'Sign-In Failed',
            description: 'Only users with a @nova.com or @edito.com email can sign in.',
        });
        setIsGoogleLoading(false);
        return;
      }
      
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
       await setDoc(userDocRef, {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'Google User',
        createdAt: new Date().toISOString(),
        plan: 'free',
      }, { merge: true });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message || 'Could not sign in with Google.',
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <BrainCircuit className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue to QuizNova.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>

           <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                 {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                 <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 173.4 58.2l-67.4 66.2C324.5 98.4 289.3 80 248 80c-82.3 0-149.3 66.9-149.3 148.7s67 148.7 149.3 148.7c97.1 0 131.3-72.8 135.2-109.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
                 </svg>}
                Google
            </Button>


          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
