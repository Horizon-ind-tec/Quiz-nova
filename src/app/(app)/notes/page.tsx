'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, FileText, BookOpenText } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { generateChapterNotesAction } from '@/app/actions';
import { CLASSES, SUBJECTS_DATA, BOARDS } from '@/lib/data';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

const formSchema = z.object({
  class: z.string().min(1, 'Please select a class.'),
  subject: z.string().min(1, 'Please select a subject.'),
  board: z.string().optional(),
  chapter: z.string().min(1, 'Chapter name is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function NotesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [, setGeneratedNotes] = useLocalStorage<string | null>('lastGeneratedNotes', null);
  const [, setNotesDetails] = useLocalStorage<any | null>('lastNotesDetails', null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class: '',
      subject: '',
      board: '',
      chapter: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not logged in',
        description: 'You need to be logged in to generate notes.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const result = await generateChapterNotesAction(data);

      if (result && result.notes) {
        // AURA SYSTEM: Add notes → +15 Aura
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            points: increment(15)
        });

        setGeneratedNotes(result.notes);
        setNotesDetails(data);
        router.push('/notes/view');
      } else {
        throw new Error('AI failed to generate notes. Please try again.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Something went wrong.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="AI Chapter Notes" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-6 md:p-8 flex justify-center">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpenText className="h-6 w-6 text-indigo-600" />
                    Generate Study Notes
                </CardTitle>
                <CardDescription>
                  Enter the chapter details and let Nova generate high-quality, comprehensive study notes for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField name="class" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                            <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="board" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Board (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger></FormControl>
                            <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField name="subject" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                          <SelectContent>{SUBJECTS_DATA.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField
                      control={form.control}
                      name="chapter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chapter Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Photosynthesis, Human Eye, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isLoading ? 'Generating Notes...' : 'Generate Notes'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
