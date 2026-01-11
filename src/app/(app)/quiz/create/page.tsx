
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { generateQuizAction } from '@/app/actions';
import { CLASSES, SUBJECTS_DATA, BOARDS, DIFFICULTIES } from '@/lib/data';
import type { Quiz } from '@/lib/types';
import { useUser } from '@/firebase';

const formSchema = z.object({
  class: z.string().min(1, 'Please select a class.'),
  subject: z.string().min(1, 'Please select a subject.'),
  subCategories: z.array(z.string()).optional(),
  board: z.string().min(1, 'Please select an educational board.'),
  chapter: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  numberOfQuestions: z.coerce.number().min(1, "You must have at least 1 question.").max(50, "You can have at most 50 questions."),
  quizType: z.enum(['quiz', 'exam'], { required_error: 'Please select a quiz type.' }),
  ncert: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateQuizPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setQuiz] = useLocalStorage<Quiz | null>('currentQuiz', null);
  const router = useRouter();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class: '',
      subject: '',
      subCategories: [],
      board: '',
      chapter: '',
      difficulty: 'medium',
      numberOfQuestions: 10,
      quizType: 'quiz',
      ncert: false,
    },
  });

  const selectedSubjectName = form.watch('subject');
  const selectedSubject = SUBJECTS_DATA.find(s => s.name === selectedSubjectName);

  const onSubmit = async (data: FormValues) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not logged in',
            description: 'You need to be logged in to create a quiz.',
        });
        return;
    }
    setIsLoading(true);
    try {
      const result = await generateQuizAction({
        ...data,
        subCategory: data.subCategories?.join(', '),
      });

      if (result && result.questions.length > 0) {
        const newQuiz: Quiz = {
          id: uuidv4(),
          ...data,
          subCategory: data.subCategories?.join(', '),
          questions: result.questions,
          createdAt: Date.now(),
        };
        setQuiz(newQuiz);
        router.push('/quiz/take');
      } else {
        throw new Error('AI failed to generate a quiz. Please try again.');
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
      <Header title="New Quiz" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-6 md:p-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Create a New Assessment</CardTitle>
              <CardDescription>Select your preferences and let our AI generate a custom quiz or exam for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    name="quizType"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <FormItem>
                              <FormControl>
                                <RadioGroupItem value="quiz" id="type-quiz" className="sr-only" />
                              </FormControl>
                              <FormLabel
                                htmlFor="type-quiz"
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <span className="font-bold">Quiz</span>
                                <span className="text-xs text-muted-foreground">Interactive session</span>
                              </FormLabel>
                            </FormItem>
                             <FormItem>
                              <FormControl>
                                <RadioGroupItem value="exam" id="type-exam" className="sr-only" />
                              </FormControl>
                              <FormLabel
                                htmlFor="type-exam"
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <span className="font-bold">Exam</span>
                                <span className="text-xs text-muted-foreground">Paper-style test</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="subject"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('subCategories', []);
                            }}
                            defaultValue={field.value}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                          >
                            {SUBJECTS_DATA.map(subject => {
                              const Icon = subject.icon;
                              return (
                              <FormItem key={subject.name} className="flex-1">
                                <FormControl>
                                  <RadioGroupItem value={subject.name} id={subject.name} className="sr-only" />
                                </FormControl>
                                <FormLabel
                                  htmlFor={subject.name}
                                  className={cn(
                                    "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-28"
                                  )}
                                >
                                  <Icon className="h-8 w-8 mb-2" />
                                  <span>{subject.name}</span>
                                </FormLabel>
                              </FormItem>
                            )})}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedSubject && selectedSubject.subCategories && (
                     <FormField
                        name="subCategories"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{selectedSubject.name} Category</FormLabel>
                            <FormControl>
                                {selectedSubject.multiSelect ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedSubject.subCategories?.map(sub => (
                                            <FormItem key={sub.name} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(sub.name)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), sub.name])
                                                                : field.onChange(field.value?.filter(value => value !== sub.name))
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    {sub.name}
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </div>
                                ) : (
                                    <RadioGroup
                                        onValueChange={(value) => field.onChange([value])}
                                        value={field.value?.[0]}
                                        className="grid grid-cols-2 gap-2"
                                    >
                                        {selectedSubject.subCategories?.map(sub => (
                                            <FormItem key={sub.name} className="flex-1">
                                                <FormControl>
                                                    <RadioGroupItem value={sub.name} id={`sub-${sub.name}`} className="sr-only" />
                                                </FormControl>
                                                <FormLabel
                                                    htmlFor={`sub-${sub.name}`}
                                                    className={cn(
                                                        "flex flex-col items-start justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                                    )}
                                                >
                                                    <span className="font-semibold">{sub.name}</span>
                                                    {sub.description && <span className="text-sm text-muted-foreground mt-1">{sub.description}</span>}
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  )}

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
                        <FormLabel>Educational Board</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a board" /></SelectTrigger></FormControl>
                          <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel htmlFor="ncert-mode" className="mb-0">
                      NCERT Curriculum
                    </FormLabel>
                    <FormField
                      control={form.control}
                      name="ncert"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              id="ncert-mode"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                   <FormField
                    control={form.control}
                    name="chapter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter/Topic (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Photosynthesis, Algebra" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                   <FormField
                    control={form.control}
                    name="numberOfQuestions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Questions</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="50" placeholder="e.g., 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField name="difficulty" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-1">
                          {DIFFICULTIES.map(d => (
                            <FormItem key={d.value} className="flex-1">
                              <FormControl>
                                <RadioGroupItem value={d.value} id={`diff-${d.value}`} className="sr-only" />
                              </FormControl>
                              <FormLabel htmlFor={`diff-${d.value}`} className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer")}>
                                {d.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full !mt-8" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Generating...' : 'Generate'}
                  </Button>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
