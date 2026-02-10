'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addDoc, collection } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Quiz, QuizAttempt, MCQ, UserAnswers } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useUser } from '@/firebase';

type QuizState = 'loading' | 'taking' | 'paused' | 'results';

export default function TakeQuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [quiz] = useLocalStorage<Quiz | null>('currentQuiz', null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [score, setScore] = useState(0);
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [quizProgress, setQuizProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const stripOptionPrefix = (text: string) => {
    if (!text) return '';
    // Removes patterns like "a) ", "b. ", "(c) ", "1) " from the start of the string
    return text.replace(/^([a-zA-Z0-9])[\.\)\-]\s+|^(\([a-zA-Z0-9]\))\s+/i, '').trim();
  };
  
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
      quiz.questions.forEach((q, index) => {
        if (q.type === 'mcq' || q.type === 'numerical') initialAnswers[index] = '';
        else if (q.type === 'match') {
          initialAnswers[index] = {};
        }
      });
      setUserAnswers(initialAnswers);
      setCurrentQuestionIndex(0);
      setQuizProgress(0);
      setQuizState('taking');
      setTimeElapsed(0);
    } else {
      router.replace('/quiz/create');
    }
  }, [quiz, router]);
  
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

  const renderMCQ = (q: MCQ, questionIndex: number) => {
    const userAnswer = userAnswers[questionIndex] as string;
    const isAnswered = userAnswer !== '' && userAnswer !== undefined;
    const inQuizMode = quiz?.quizType === 'quiz';

    return (
        <div className="space-y-4">
            <p className="font-semibold text-lg">{currentQuestionIndex + 1}. {q.question}</p>
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
                        <div key={option + index} className="flex items-center w-full">
                            <RadioGroupItem value={option} id={`q${questionIndex}-option-${index}`} className="sr-only" />
                            <Label
                                htmlFor={`q${questionIndex}-option-${index}`}
                                className={cn("flex items-center space-x-3 space-y-0 rounded-md border p-3 transition-all w-full", getOptionStyle())}
                            >
                                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold">
                                    {String.fromCharCode(65 + index)}
                                </div>
                                <span className="flex-1">{cleanOption}</span>
                                {inQuizMode && isAnswered && isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                                {inQuizMode && isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                            </Label>
                        </div>
                    );
                })}
            </RadioGroup>
        </div>
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
                    {q.type === 'mcq' ? renderMCQ(q, currentQuestionIndex) : <p>Interactive support coming soon for this type.</p>}
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
