'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Quiz, QuizAttempt } from '@/lib/types';

type QuizState = 'loading' | 'taking' | 'results';

export default function TakeQuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [quiz, setQuiz] = useLocalStorage<Quiz | null>('currentQuiz', null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [, setQuizHistory] = useLocalStorage<QuizAttempt[]>('quizHistory', []);
  const router = useRouter();

  useEffect(() => {
    if (quiz) {
      setUserAnswers(Array(quiz.questions.length).fill(''));
      setCurrentQuestionIndex(0);
      setScore(0);
      setQuizState('taking');
    } else {
      // If no quiz is found, redirect to create page
      router.replace('/quiz/create');
    }
  }, [quiz, router]);

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
    router.push('/quiz/create');
  };

  const renderContent = () => {
    switch (quizState) {
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
    <div className="flex flex-col">
      <Header title="Take Quiz" />
      <main className="flex-1 p-4 pt-6 md:p-8 flex justify-center items-start">
        <div className="w-full max-w-2xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
