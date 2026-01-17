'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, History, FilePlus, TestTubeDiagonal, FileText } from 'lucide-react';
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
  generationMode: z.enum(['new', 'previous'], { required_error: 'Please select a source.' }),
  class: z.string().min(1, 'Please select a class.'),
  subject: z.string().min(1, 'Please select a subject.'),
  subCategories: z.array(z.string()).optional(),
  board: z.string().optional(),
  chapter: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  totalMarks: z.coerce.number().min(5, "Total marks must be at least 5.").max(100, "Total marks can be at most 100."),
  timeLimit: z.coerce.number().min(1, "Time limit must be at least 1 minute.").optional(),
  quizType: z.enum(['quiz', 'exam'], { required_error: 'Please select an assessment type.' }),
  ncert: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CombinedSelection = 'new-quiz' | 'previous-quiz' | 'new-exam' | 'previous-exam';

export default function CreateQuizPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setQuiz] = useLocalStorage<Quiz | null>('currentQuiz', null);
  const [lastQuizOptions, setLastQuizOptions] = useLocalStorage<FormValues | null>('lastQuizOptions', null);
  const router = useRouter();
  const { user } = useUser();
  const [combinedSelection, setCombinedSelection] = useState<CombinedSelection>('new-quiz');


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generationMode: 'new',
      quizType: 'quiz',
      class: '',
      subject: '',
      subCategories: [],
      board: '',
      chapter: '',
      difficulty: 'medium',
      totalMarks: 20,
      timeLimit: undefined,
      ncert: false,
    },
  });
  
    const handleSelectionChange = (value: CombinedSelection) => {
        setCombinedSelection(value);
        const [mode, type] = value.split('-');
        form.setValue('generationMode', mode as 'new' | 'previous');
        form.setValue('quizType', type as 'quiz' | 'exam');
    }

  const selectedSubjectName = form.watch('subject');
  const selectedSubject = SUBJECTS_DATA.find(s => s.name === selectedSubjectName);
  const generationMode = form.watch('generationMode');

  const handleSubjectChange = (value: string) => {
    form.setValue('subject', value, { shouldValidate: true });
    form.setValue('subCategories', [], { shouldValidate: false });
  };
  
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

    let generationInput = { ...data };

    if (generationMode === 'new') {
        generationInput = { ...data, seed: Math.random(), timestamp: Date.now() };
        setLastQuizOptions(data);
    } else {
        if (!lastQuizOptions) {
            toast({
                variant: 'destructive',
                title: 'No Previous Quiz',
                description: 'No previous quiz settings found. Please create a new quiz first.',
            });
            setIsLoading(false);
            return;
        }
        generationInput = { ...lastQuizOptions, totalMarks: data.totalMarks, timeLimit: data.timeLimit };
    }

    let timeLimitInSeconds: number;
    if (generationInput.timeLimit && generationInput.timeLimit > 0) {
        timeLimitInSeconds = generationInput.timeLimit * 60;
    } else {
        // AI automatically gives a time. Approx 1.5 mins per mark.
        const timePerMark = 90; 
        timeLimitInSeconds = generationInput.totalMarks * timePerMark;
    }


    try {
      const result = await generateQuizAction({
        ...generationInput,
        subCategory: generationInput.subCategories?.join(', '),
      });

      if (result && result.questions.length > 0) {
        const shuffledQuestions = result.questions.map(q => {
            if (q.type === 'mcq') {
                const allOptions = [...q.options];
                for (let i = allOptions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
                }
                return { ...q, options: allOptions };
            }
            return q;
        });

        const newQuiz: Quiz = {
          id: uuidv4(),
          ...generationInput,
          subCategory: generationInput.subCategories?.join(', '),
          timeLimit: timeLimitInSeconds,
          questions: shuffledQuestions,
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

                   <FormItem>
                        <FormLabel>Assessment Type & Source</FormLabel>
                        <RadioGroup
                            value={combinedSelection}
                            onValueChange={(value) => handleSelectionChange(value as CombinedSelection)}
                            className="grid grid-cols-2 gap-4"
                        >
                            {[
                                { value: 'new-quiz', icon: TestTubeDiagonal, label: 'New Quiz', sub: 'Unique questions' },
                                { value: 'previous-quiz', icon: History, label: 'Previous Quiz', sub: 'Regenerate last test' },
                                { value: 'new-exam', icon: FileText, label: 'New Exam', sub: 'Paper-style test' },
                                { value: 'previous-exam', icon: History, label: 'Previous Exam', sub: 'Regenerate last exam' }
                            ].map((item) => (
                                <FormItem key={item.value}>
                                    <FormControl>
                                        <RadioGroupItem value={item.value} id={item.value} className="sr-only" />
                                    </FormControl>
                                    <FormLabel
                                        htmlFor={item.value}
                                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 [&:has([data-state=checked])]:border-green-500 cursor-pointer"
                                    >
                                        <item.icon className="h-6 w-6 mb-1" />
                                        <span className="font-bold">{item.label}</span>
                                        <span className="text-xs text-muted-foreground">{item.sub}</span>
                                    </FormLabel>
                                </FormItem>
                            ))}
                        </RadioGroup>
                        <FormMessage />
                    </FormItem>
                  
                  <div className={cn(generationMode === 'previous' && 'opacity-50 pointer-events-none')}>
                    <div className="space-y-6">
                      <FormField
                        name="subject"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={handleSubjectChange}
                                value={field.value}
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
                                        "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 [&:has([data-state=checked])]:border-green-500 cursor-pointer h-28"
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {selectedSubject.subCategories?.map(sub => (
                                                <FormItem key={sub.name} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(sub.name)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? form.setValue('subCategories', [...(field.value || []), sub.name])
                                                                    : form.setValue('subCategories', field.value?.filter(value => value !== sub.name));
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
                                            onValueChange={(value) => form.setValue('subCategories', [value])}
                                            value={field.value?.[0]}
                                            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                                        >
                                            {selectedSubject.subCategories?.map(sub => (
                                                <FormItem key={sub.name} className="flex-1">
                                                    <FormControl>
                                                        <RadioGroupItem value={sub.name} id={`sub-${sub.name}`} className="sr-only" />
                                                    </FormControl>
                                                    <FormLabel
                                                        htmlFor={`sub-${sub.name}`}
                                                        className={cn(
                                                            "flex flex-col items-start justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 [&:has([data-state=checked])]:border-green-500 cursor-pointer"
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
                            <FormLabel>Educational Board (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="totalMarks"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Marks</FormLabel>
                                <FormControl>
                                <Input type="number" min="5" max="100" placeholder="e.g., 20" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="timeLimit"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Time Limit (Minutes, optional)</FormLabel>
                                <FormControl>
                                <Input type="number" min="1" placeholder="Auto-assigned if blank" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      </div>

                      <FormField name="difficulty" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <FormControl>
                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-1">
                              {DIFFICULTIES.map(d => (
                                <FormItem key={d.value} className="flex-1">
                                  <FormControl>
                                    <RadioGroupItem value={d.value} id={`diff-${d.value}`} className="sr-only" />
                                  </FormControl>
                                  <FormLabel htmlFor={`diff-${d.value}`} className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 [&:has([data-state=checked])]:border-green-500 cursor-pointer")}>
                                    {d.label}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

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
