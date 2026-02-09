'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Loader2,
} from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { addDoc, collection } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import type { Quiz, QuizAttempt, Question, MCQ, Match, Numerical, UserAnswers, ShortAnswer, LongAnswer } from '@/lib/types';
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
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateQuizAction } from '@/app/actions';


type QuizState = 'loading' | 'taking' | 'paused' | 'results';

export default function TakeQuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [quiz, setQuiz] = useLocalStorage<Quiz | null>('currentQuiz', null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const router = useRouter();
  const form = useForm();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [shuffledMatches, setShuffledMatches] = useState<{[key: number]: string[]}>({});
  const [quizProgress, setQuizProgress] = useState(0);
  const [isGeneratingNewQuestion, setIsGeneratingNewQuestion] = useState(false);
  
  const totalTime = useMemo(() => {
    if (!quiz) return 0;
    if (quiz.timeLimit && quiz.timeLimit > 0) return quiz.timeLimit;
    const timePerMark = 90; 
    return (quiz.totalMarks ?? 0) * timePerMark;
  }, [quiz]);

  const [timeElapsed, setTimeElapsed] = useState(0);

  const stripOptionPrefix = (text: string) => {
    if (!text) return '';
    return text.replace(/^([a-zA-Z0-9])[\.\)\-]\s+|^(\([a-zA-Z0-9]\))\s+/i, '').trim();
  };
  
  const shuffleArray = useCallback((array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);
  
  const calculateScore = useCallback(() => {
    if (!quiz) return 0;
    let totalObtainedMarks = 0;
    quiz.questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        let isCorrect = false;
        if (q.type === 'mcq' && userAnswer === q.correctAnswer) isCorrect = true;
        else if (q.type === 'numerical' && Number(userAnswer) === q.correctAnswer) isCorrect = true;
        else if (q.type === 'match') {
            const userMatches = userAnswer as { [key: string]: string };
            if (q.pairs.every(p => userMatches?.[p.item] === p.match)) isCorrect = true;
        }
        if (isCorrect) totalObtainedMarks += q.marks;
    });
    return Math.round((totalObtainedMarks / (quiz.totalMarks ?? 1)) * 100);
  }, [quiz, userAnswers]);

  const finishQuiz = useCallback(async () => {
    if (!quiz || !user || !firestore) return;
    const finalScore = calculateScore();
    setScore(finalScore);
    const newQuizAttempt: QuizAttempt = {
      ...quiz,
      id: uuidv4(),
      userAnswers: userAnswers,
      score: finalScore,
      completedAt: Date.now(),
      userId: user.uid,
      completionTime: timeElapsed,
    };
    try {
        const quizResultsRef = collection(firestore, 'users', user.uid, 'quiz_results');
        await addDoc(quizResultsRef, newQuizAttempt);
    } catch(error) {
        console.error("Error saving quiz result:", error);
    }
    setQuizState('results');
  }, [quiz, user, firestore, userAnswers, timeElapsed, calculateScore]);

  useEffect(() => {
    if (quiz) {
      const initialAnswers: UserAnswers = {};
      const initialShuffles: {[key: number]: string[]} = {};
      quiz.questions.forEach((q, index) => {
        if (q.type === 'mcq' || q.type === 'numerical') initialAnswers[index] = '';
        else if (q.type === 'match') {
          initialAnswers[index] = {};
          initialShuffles[index] = shuffleArray(q.pairs.map(p => p.match));
        }
      });
      setUserAnswers(initialAnswers);
      setShuffledMatches(initialShuffles);
      setMarkedForReview(Array(quiz.questions.length).fill(false));
      setCurrentQuestionIndex(0);
      setQuizProgress(0);
      setQuizState('taking');
      setTimeElapsed(0);
    } else {
      router.replace('/quiz/create');
    }
  }, [quiz, router, shuffleArray]);
  
  useEffect(() => {
    if (quizState !== 'taking') return;
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [quizState]);

  const handleAnswerSelect = (questionIndex: number, answer: any) => {
    const q = quiz?.questions[questionIndex];
    if (!q) return;
    const inQuizMode = quiz?.quizType === 'quiz';
    const isAlreadyAnswered = userAnswers[questionIndex] !== '' && userAnswers[questionIndex] !== undefined && Object.keys(userAnswers[questionIndex]).length > 0;
    if (inQuizMode && isAlreadyAnswered) return;
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    if (inQuizMode) {
      if (q.type === 'mcq' && answer === q.correctAnswer) {
        setQuizProgress(prev => Math.min(100, prev + (q.marks / (quiz.totalMarks || 1)) * 100));
      }
    }
  };

  const totalQuestions = quiz?.questions.length ?? 0;
  const q = quiz?.questions[currentQuestionIndex];

  const renderMCQ = (q: MCQ, questionIndex: number, isExam: boolean) => {
    const userAnswer = userAnswers[questionIndex] as string;
    const isAnswered = userAnswer !== '' && userAnswer !== undefined;
    const inQuizMode = quiz?.quizType === 'quiz';

    return (
        <>
            <p className="font-semibold mb-4">{quiz?.questions.indexOf(q) + 1}. {q.question}</p>
            <RadioGroup
                value={userAnswer}
                onValueChange={(value) => handleAnswerSelect(questionIndex, value)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                disabled={inQuizMode && isAnswered}
            >
                {q.options.map((option, index) => {
                    const cleanOption = stripOptionPrefix(option);
                    const isCorrect = option === q.correctAnswer;
                    const isSelected = option === userAnswer;
                    const getOptionStyle = () => {
                      if (!inQuizMode || !isAnswered) return "border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer";
                      if (isSelected) {
                          return isCorrect ? "border-green-500 bg-green-100 text-green-900 font-semibold" : "border-red-500 bg-red-100 text-red-900 font-semibold";
                      }
                      return isCorrect ? "border-green-500 bg-green-100 text-green-900" : "border-gray-300 opacity-70 cursor-not-allowed";
                    };
                    return (
                        <FormItem key={option + index}>
                            <FormControl>
                                <RadioGroupItem value={option} id={`q${questionIndex}-option-${index}`} className="sr-only" />
                            </FormControl>
                            <FormLabel
                                htmlFor={`q${questionIndex}-option-${index}`}
                                className={cn("flex items-center space-x-3 space-y-0 rounded-md border p-3 transition-all", getOptionStyle())}
                            >
                                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0">
                                    {String.fromCharCode(65 + index)}
                                </div>
                                <span className="flex-1">{cleanOption}</span>
                                {inQuizMode && isAnswered && isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                                {inQuizMode && isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                            </FormLabel>
                        </FormItem>
                    );
                })}
            </RadioGroup>
        </>
    );
  };

  const renderContent = () => {
    if (quizState === 'results' && quiz) {
        return (
            <Card>
                <CardHeader className="items-center text-center">
                    <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
                    <div className="text-4xl font-bold mt-4">{score}%</div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {quiz.questions.map((q, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>Question {index + 1}</AccordionTrigger>
                                <AccordionContent className="p-4 bg-secondary/30 rounded-md">
                                    <p className="font-semibold mb-2">{q.question}</p>
                                    {q.type === 'mcq' && (
                                        <ul className="space-y-1">
                                            {q.options.map((opt, i) => (
                                                <li key={i} className={cn(opt === q.correctAnswer ? "text-green-600 font-bold" : "")}>
                                                    {String.fromCharCode(65 + i)}) {stripOptionPrefix(opt)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <Separator className="my-3" />
                                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    <Button onClick={() => router.push('/quiz/create')} className="w-full mt-6">Create Another</Button>
                </CardContent>
            </Card>
        );
    }

    if (!quiz || !q) return null;

    return (
        <Card className="w-full">
            <div className="p-4 border-b">
                <Progress value={quizProgress} className="h-2" />
                <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2 font-medium">
                        <Clock className="h-5 w-5" />
                        <span>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <Button onClick={finishQuiz} className="bg-green-600">SUBMIT</Button>
                </div>
            </div>
            <CardContent className="p-6">
                <div className="mb-6">
                    {q.type === 'mcq' ? renderMCQ(q, currentQuestionIndex, false) : <p>Interactive support coming soon for this type.</p>}
                </div>
                <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0}>Previous</Button>
                    <Button onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))} disabled={currentQuestionIndex === totalQuestions - 1}>Next</Button>
                </div>
            </CardContent>
        </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
       <main className="flex-1 p-2 pt-4 md:p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl pb-20 md:pb-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
