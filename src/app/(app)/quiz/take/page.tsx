'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Bookmark,
  Grid,
} from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Quiz, QuizAttempt } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type QuizState = 'loading' | 'taking' | 'paused' | 'results';

export default function TakeQuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [quiz, setQuiz] = useLocalStorage<Quiz | null>('currentQuiz', null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [, setQuizHistory] = useLocalStorage<QuizAttempt[]>('quizHistory', []);
  const router = useRouter();
  const form = useForm();

  const timePerQuestion = quiz?.quizType === 'exam' ? 180 : 120; // 3 mins for exam, 2 for quiz
  const totalTime = useMemo(() => (quiz?.questions.length ?? 0) * timePerQuestion, [quiz, timePerQuestion]);
  const [timeRemaining, setTimeRemaining] = useState(totalTime);

  useEffect(() => {
    if (quiz) {
      setUserAnswers(Array(quiz.questions.length).fill(''));
      setMarkedForReview(Array(quiz.questions.length).fill(false));
      setCurrentQuestionIndex(0);
      setScore(0);
      setQuizState('taking');
      setTimeRemaining(totalTime);
    } else {
      router.replace('/quiz/create');
    }
  }, [quiz, router, totalTime]);
  
  useEffect(() => {
    if (quizState !== 'taking' || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizState, timeRemaining]);


  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length ?? 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleClearSelection = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = '';
    setUserAnswers(newAnswers);
  };

  const handleMarkForReview = () => {
    const newMarked = [...markedForReview];
    newMarked[currentQuestionIndex] = !newMarked[currentQuestionIndex];
    setMarkedForReview(newMarked);
  }

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
    router.push('/quiz/create');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const renderContent = () => {
    switch (quizState) {
      case 'taking':
      case 'paused':
        if (!quiz) return null;
        const currentQuestion = quiz.questions[currentQuestionIndex];
        const isMarked = markedForReview[currentQuestionIndex];

        if (quizState === 'paused') {
          return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <Card className="p-8">
                  <Pause className="h-12 w-12 mx-auto text-primary" />
                  <h2 className="text-2xl font-bold mt-4">Quiz Paused</h2>
                  <p className="text-muted-foreground mt-2">Your progress is saved. Come back when you're ready.</p>
                  <Button onClick={() => setQuizState('taking')} className="mt-6">Resume</Button>
                </Card>
              </div>
          )
        }

        return (
          <FormProvider {...form}>
            <Card className="w-full">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={() => setQuizState('paused')}>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </Button>
                  <div className="flex items-center gap-2 font-medium text-red-500">
                    <Clock className="h-5 w-5" />
                    <span>{formatTime(timeRemaining)}</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white px-4">SUBMIT</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will end the quiz and calculate your score. You cannot undo this action.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={finishQuiz}>Submit</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
               <div className="p-4 border-b flex justify-between items-center bg-secondary/30">
                  <div>
                    <h2 className="font-semibold">{quiz.subject}</h2>
                    <p className="text-sm text-muted-foreground">{quiz.chapter || 'General'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon"><Bookmark className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon"><Grid className="h-4 w-4"/></Button>
                  </div>
               </div>

              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Question {currentQuestionIndex + 1}/{quiz.questions.length}
                  </p>
                   <div className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">+4.0 / -1.0</div>
                </div>

                <p className="text-base font-medium mb-6">{currentQuestion.question}</p>

                <RadioGroup
                  value={userAnswers[currentQuestionIndex]}
                  onValueChange={handleAnswerSelect}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <FormItem key={index}>
                      <FormControl>
                        <RadioGroupItem value={option} id={`option-${index}`} className="sr-only" />
                      </FormControl>
                      <FormLabel
                        htmlFor={`option-${index}`}
                        className={cn(
                          "flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors",
                          "hover:bg-blue-50",
                          userAnswers[currentQuestionIndex] === option ? "border-blue-500 bg-blue-50" : "border-input bg-white"
                        )}
                      >
                         <div className={cn(
                           "w-6 h-6 rounded-full border flex items-center justify-center shrink-0",
                           userAnswers[currentQuestionIndex] === option ? "border-blue-500 bg-blue-500 text-white" : "border-gray-400 bg-white text-gray-600"
                           )}>
                           {String.fromCharCode(65 + index)}
                         </div>
                        <span className="font-normal flex-1">{option}</span>
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
                
                <div className="mt-6 flex items-center justify-start">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-transparent">
                        <AlertTriangle className="mr-2 h-4 w-4" /> Report
                    </Button>
                </div>
              </CardContent>
            </Card>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] flex justify-between items-center md:relative md:bg-transparent md:border-none md:shadow-none md:mt-4 md:p-0">
                 <Button onClick={handlePrevQuestion} variant="outline" disabled={currentQuestionIndex === 0} className="md:flex-1 md:mr-2">
                    <ArrowLeft className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">Previous</span>
                  </Button>

                  <div className="flex-1 flex justify-center items-center gap-2 mx-2">
                     <Button onClick={handleMarkForReview} variant="outline" className="flex-1 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">
                         Mark for Review
                      </Button>
                      <Button onClick={handleClearSelection} variant="outline" className="flex-1 bg-blue-500 text-white hover:bg-blue-600">
                          Clear Selection
                      </Button>
                  </div>
                  
                  <Button onClick={handleNextQuestion} variant="outline" disabled={currentQuestionIndex === quiz.questions.length - 1} className="md:flex-1 md:ml-2">
                     <span className="hidden md:inline">Next</span>
                    <ArrowRight className="h-5 w-5 md:ml-2" />
                  </Button>
            </div>
          </FormProvider>
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
                    className="stroke-primary"
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
      case 'loading':
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p>Loading your quiz...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
       <main className="flex-1 p-2 pt-4 md:p-6 flex justify-center items-start">
        <div className="w-full max-w-2xl pb-20 md:pb-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
