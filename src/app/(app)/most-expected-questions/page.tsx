'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, Target } from 'lucide-react';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

import { generateMostExpectedQuestionsAction } from '@/app/actions';
import { CLASSES, SUBJECTS, BOARDS } from '@/lib/data';
import { useUser } from '@/firebase';

const formSchema = z.object({
  class: z.string().min(1, 'Please select a class.'),
  subject: z.string().min(1, 'Please select a subject.'),
  board: z.string().min(1, 'Please select a board.'),
  chapter: z.string().min(1, 'Chapter is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function MostExpectedQuestionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

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
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not logged in',
        description: 'You need to be logged in to generate questions.',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedQuestions(null);

    try {
      const result = await generateMostExpectedQuestionsAction(data);
      if (result && result.questions) {
        setGeneratedQuestions(result.questions);
      } else {
        throw new Error('AI failed to generate questions. Please try again.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Something went wrong.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Most Expected Questions" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-destructive" />
                    Generate High-Probability Questions
                </CardTitle>
                <CardDescription>
                  Leverage AI to get a list of the most important questions for your upcoming exams, based on examiner insights.
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
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger></FormControl>
                            <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name="board" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Board</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a board" /></SelectTrigger></FormControl>
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
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger></FormControl>
                          <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField
                      control={form.control}
                      name="chapter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chapter/Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Thermodynamics" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full !mt-8" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isLoading ? 'Generating...' : 'Generate Questions'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Questions</CardTitle>
                <CardDescription>Your curated list of questions will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] w-full rounded-md border p-4 bg-muted/50">
                  {isLoading && (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-4 text-muted-foreground">AI is thinking like an examiner...</p>
                    </div>
                  )}
                  {generatedQuestions ? (
                    <div className="text-sm whitespace-pre-wrap font-sans">
                      {generatedQuestions}
                    </div>
                  ) : (
                    !isLoading && (
                        <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                            <p>Fill out the form to generate your questions.</p>
                        </div>
                    )
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
