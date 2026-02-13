'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore';

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
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Quiz, QuizAttempt, MCQ, UserAnswers, UserProfile, Challenge } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useUser } from '@/firebase';
import { Sparkles } from 'lucide-react';

type QuizState = 'loading' | 'taking' | 'paused' | 'results';

export default function TakeQuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [quiz] = useLocalStorage<Quiz | null>('currentQuiz', null);
  const [challengeId, setChallengeId] = useLocalStorage<string | null>('currentChallengeId', null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [score, setScore] = useState(0);
  const [earnedPoints, setPoints] = useState(0);
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [quizProgress, setQuizProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const stripOptionPrefix = (text: string) => {
    if (!text) return '';
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
    
    const pointsToAdd = Math.round((finalScore / 100) * quiz.totalMarks * 10);
    setPoints(pointsToAdd);

    if (challengeId) {
        try {
            const chalRef = doc(firestore, 'challenges', challengeId);
            const chalSnap = await getDoc(chalRef);
            if (chalSnap.exists()) {
                const chalData = chalSnap.data() as Challenge;
                const isCreator = user.uid === chalData.creatorId;
                
                if (isCreator) {
                    await updateDoc(chalRef, { creatorScore: finalScore });
                } else {
                    await updateDoc(chalRef, { friendScore: finalScore });
                }

                const updatedChalSnap = await getDoc(chalRef);
                const updatedData = updatedChalSnap.data() as Challenge;
                if (updatedData.creatorScore !== null && updatedData.friendScore !== null) {
                    await updateDoc(chalRef, { status: 'completed' });
                }
            }
        } catch (e) {
            console.error("Challenge sync error:", e);
        }
    }

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

        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const currentData = userSnap.data() as UserProfile;
            const newTotalPoints = (currentData.points || 0) + pointsToAdd;
            
            let newRank: UserProfile['rank'] = 'Bronze';
            if (newTotalPoints > 50000) newRank = 'Diamond';
            else if (newTotalPoints > 15000) newRank = 'Platinum';
            else if (newTotalPoints > 5000) newRank = 'Gold';
            else if (newTotalPoints > 1000) newRank = 'Silver';

            await updateDoc(userRef, {
                points: newTotalPoints,
                rank: newRank
            });
        }
    } catch(error) {
        console.error("Error saving quiz result:", error);
    }
    setQuizState('results');
  }, [quiz, user, firestore, userAnswers, timeElapsed, calculateScore, challengeId]);

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
    const isAlreadyAnswered = userAnswers[questionIndex] !== '' && userAnswers[questionIndex] !== undefined && (typeof userAnswers[questionIndex] === 'object' ? Object.keys(userAnswers[questionIndex]).length > 0 : true);
    if (inQuizMode && isAlreadyAnswered && userAnswers[questionIndex] !== '') return;
    
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    if (inQuizMode) {
      if (q.type === 'mcq' && answer === q.correctAnswer) {
        setQuizProgress(prev => Math.min(100, prev + (q.marks / (quiz.totalMarks || 1)) * 100));
      }
    }
  };

  const handleReturn = () => {
      if (challengeId) {
          router.push(`/Quiznova.Challenge/${challengeId}`);
          setChallengeId(null);
      } else {
          router.push('/dashboard');
      }
  }

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
            <Card className="border-none shadow-2xl overflow-hidden">
                <CardHeader className="items-center text-center bg-indigo-600 text-white py-10 relative">
                    <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-full">
                        <Trophy className="h-8 w-8 text-yellow-300" />
                    </div>
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter">Assessment Complete!</CardTitle>
                    <div className="text-6xl font-black mt-4 flex items-baseline gap-1">
                        {score}<span className="text-2xl opacity-70">%</span>
                    </div>
                    <div className="mt-4 bg-white/20 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                        +{earnedPoints} XP Earned
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4 mb-8">
                        <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">Question Review</h4>
                        <Accordion type="single" collapsible className="w-full">
                            {quiz.questions.map((q, index) => (
                                <AccordionItem value={`item-${index}`} key={index} className="border-slate-100">
                                    <AccordionTrigger className="text-left font-bold text-sm">Question {index + 1}</AccordionTrigger>
                                    <AccordionContent className="p-4 bg-slate-50 rounded-lg mt-2">
                                        <p className="font-bold mb-3 text-slate-800">{q.question}</p>
                                        {q.type === 'mcq' && (
                                            <ul className="space-y-2 mb-4">
                                                {q.options.map((opt, i) => (
                                                    <li key={i} className={cn(
                                                        "text-xs p-2 rounded-md border",
                                                        opt === q.correctAnswer ? "bg-green-50 border-green-200 text-green-700 font-bold" : "bg-white border-slate-200 text-slate-500"
                                                    )}>
                                                        {String.fromCharCode(65 + i)}) {stripOptionPrefix(opt)}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="bg-white p-3 rounded border-l-4 border-indigo-500 shadow-sm">
                                            <p className="text-[10px] font-black uppercase text-indigo-600 mb-1">Nova's Explanation</p>
                                            <p className="text-xs text-slate-600 leading-relaxed">{q.explanation}</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                    <Button onClick={handleReturn} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg font-black uppercase tracking-tight">
                        {challengeId ? 'View Duel Status' : 'Return to Dashboard'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!quiz || !q) return null;

    return (
        <Card className="w-full shadow-lg border-slate-200">
            <div className="p-4 border-b bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress</span>
                    <span className="text-[10px] font-black uppercase text-indigo-600">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                </div>
                <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="h-1.5" />
                <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2 font-black text-slate-700 bg-white border px-3 py-1 rounded-full shadow-sm text-sm">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <Button onClick={finishQuiz} className="bg-red-600 hover:bg-red-700 font-black uppercase text-xs tracking-widest px-6 shadow-md">SUBMIT</Button>
                </div>
            </div>
            <CardContent className="p-6 md:p-10">
                <div className="min-h-[300px]">
                    {q.type === 'mcq' ? renderMCQ(q, currentQuestionIndex) : <p>Interactive support coming soon for this type.</p>}
                </div>
                <div className="flex justify-between mt-12 pt-6 border-t">
                    <Button variant="ghost" onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} className="font-bold uppercase text-[10px] tracking-widest">Previous</Button>
                    <Button onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))} disabled={currentQuestionIndex === totalQuestions - 1} className="bg-slate-900 hover:bg-slate-800 font-bold uppercase text-[10px] tracking-widest px-8">Next</Button>
                </div>
            </CardContent>
        </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
       <main className="flex-1 p-2 pt-4 md:p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl pb-20 md:pb-0">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}
