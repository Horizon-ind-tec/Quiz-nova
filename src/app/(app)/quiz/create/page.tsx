'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { generateQuizAction } from '@/app/actions';
import { CLASSES, SUBJECTS, BOARDS, DIFFICULTIES } from '@/lib/data';
import type { Quiz, Question, QuizAttempt } from '@/lib/types';
import type { GenerateCustomQuizOutput } from '@/ai/flows/generate-custom-quiz';

const formSchema = z.object({
  class: z.string().min(1, 'Please select a class.'),
  subject: z.string().min(1, 'Please select a subject.'),
  board: z.string().min(1, 'Please select an educational board.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

type FormValues = z.infer<typeof formSchema>;
type QuizState = 'setup' | 'loading' | 'taking' | 'results';

export default function CreateQuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const { toast } = useToast();
  const [, setQuizHistory] = useLocalStorage<QuizAttempt[]>('quizHistory', []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class: '',
      subject: '',
      board: '',
      difficulty: 'medium',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setQuizState('loading');
    try {
      const result: GenerateCustomQuizOutput = await generateQuizAction(data);
      if (result && result.quiz.length > 0) {
        const newQuiz: Quiz = {
          id: uuidv4(),
          ...data,
          questions: result.quiz,
          createdAt: Date.now(),
        };
        setQuiz(newQuiz);
        setUserAnswers(Array(newQuiz.questions.length).fill(''));
        setCurrentQuestionIndex(0);
        setQuizState('taking');
      } else {
        throw new Error('AI failed to generate a quiz. Please try again.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Something went wrong.',
      });
      setQuizState('setup');
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length ?? 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!quiz) return;
    let correctAnswers = 0;
    quiz.questions.forEach((q, index) => {
      if (q.correctAnswer === userAnswers[index]) {
        correctAnswers++;
      }
    });
    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(finalScore);

    const quizAttempt: QuizAttempt = {
      ...quiz,
      userAnswers,
      score: finalScore,
      completedAt: Date.now(),
    };
    setQuizHistory(prev => [...prev, quizAttempt]);
    setQuizState('results');
  };

  const restartQuiz = () => {
    setQuiz(null);
    setQuizState('setup');
    form.reset();
  };

  const renderContent = () => {
    switch (quizState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center text-center p-8 h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold">Generating your quiz...</p>
            <p className="text-muted-foreground">The AI is crafting your questions. Please wait a moment.</p>
          </div>
        );
      case 'taking':
        if (!quiz) return null;
        const currentQuestion = quiz.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                {quiz.subject} Quiz{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  ({currentQuestionIndex + 1}/{quiz.questions.length})
                </span>
              </CardTitle>
              <Progress value={progress} className="w-full h-2 mt-2 bg-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold mb-4">{currentQuestion.question}</p>
              <RadioGroup
                value={userAnswers[currentQuestionIndex]}
                onValueChange={handleAnswerSelect}
                className="space-y-2"
              >
                {currentQuestion.options.map((option, index) => (
                  <FormItem key={index} className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-secondary/50 transition-colors">
                    <FormControl>
                      <RadioGroupItem value={option} />
                    </FormControl>
                    <FormLabel className="font-normal flex-1 cursor-pointer">{option}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
              <Button onClick={handleNextQuestion} className="w-full mt-6" disabled={!userAnswers[currentQuestionIndex]}>
                {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            </CardContent>
          </Card>
        );
      case 'results':
        if (!quiz) return null;
        return (
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              <CardDescription>You scored</CardDescription>
              <div className="relative my-4 h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-secondary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                  />
                  <path
                    className="stroke-accent"
                    strokeDasharray={`${score}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">{score}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-4 text-center">Review Your Answers</h3>
              <Accordion type="single" collapsible className="w-full">
                {quiz.questions.map((q, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer === q.correctAnswer;
                  return (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <span className="text-left font-medium">Question {index + 1}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-secondary/30 rounded-md">
                        <p className="font-semibold">{q.question}</p>
                        <p className="mt-2 text-sm">
                          Your answer: <span className={cn(isCorrect ? 'text-green-600' : 'text-destructive', 'font-semibold')}>{userAnswer || 'Not answered'}</span>
                        </p>
                        {!isCorrect && (
                          <p className="mt-1 text-sm">
                            Correct answer: <span className="font-semibold text-green-600">{q.correctAnswer}</span>
                          </p>
                        )}
                        <Separator className="my-3" />
                        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Explanation:</span> {q.explanation}</p>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              <Button onClick={restartQuiz} className="w-full mt-6">
                Create Another Quiz
              </Button>
            </CardContent>
          </Card>
        );
      case 'setup':
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Create a New Quiz</CardTitle>
              <CardDescription>Select your preferences and let our AI generate a custom quiz for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="class" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger></FormControl>
                          <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="subject" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger></FormControl>
                          <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField name="board" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Educational Board</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a board" /></SelectTrigger></FormControl>
                        <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField name="difficulty" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-1">
                          {DIFFICULTIES.map(d => (
                            <FormItem key={d.value} className="flex-1">
                              <FormControl>
                                <RadioGroupItem value={d.value} className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer")}>
                                {d.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full !mt-8" disabled={quizState === 'loading'}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Quiz
                  </Button>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="New Quiz" />
      <main className="flex-1 p-4 pt-6 md:p-8 flex justify-center items-start">
        <div className="w-full max-w-2xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
