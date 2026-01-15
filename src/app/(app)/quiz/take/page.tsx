
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import type { Quiz, QuizAttempt, Question, MCQ, Match, Numerical, UserAnswers } from '@/lib/types';
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
  
  const totalTime = useMemo(() => {
    if (!quiz) return 0;
    // For competitive exams, time is fixed regardless of marks
    if (quiz.class.startsWith('JEE') || quiz.class.startsWith('NEET')) {
        return quiz.quizType === 'exam' ? 3 * 60 * 60 : 1 * 60 * 60; // 3 hours for exam, 1 hour for quiz
    }
    // For regular classes, estimate time based on marks. Approx 1.5 mins per mark.
    const timePerMark = 90; 
    return (quiz.totalMarks ?? 0) * timePerMark;
  }, [quiz]);

  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const shuffleArray = useCallback((array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  useEffect(() => {
    if (quiz) {
      const initialAnswers: UserAnswers = {};
      const initialShuffles: {[key: number]: string[]} = {};
      quiz.questions.forEach((q, index) => {
        if (q.type === 'mcq') {
          initialAnswers[index] = '';
        } else if (q.type === 'match') {
          initialAnswers[index] = {};
          initialShuffles[index] = shuffleArray(q.pairs.map(p => p.match));
        } else if (q.type === 'numerical') {
          initialAnswers[index] = '';
        }
      });

      setUserAnswers(initialAnswers);
      setShuffledMatches(initialShuffles);
      setMarkedForReview(Array(quiz.questions.length).fill(false));
      setCurrentQuestionIndex(0);
      setScore(0);
      setQuizProgress(0);
      setQuizState('taking');
      setTimeElapsed(0);
    } else {
      if (typeof window !== 'undefined') {
        router.replace('/quiz/create');
      }
    }
  }, [quiz, router, shuffleArray]);
  
  useEffect(() => {
    if (quizState !== 'taking') return;
    const timer = setInterval(() => {
      setTimeElapsed(prevTime => {
        if (totalTime > 0 && prevTime >= totalTime - 1) {
            clearInterval(timer);
            finishQuiz();
            return totalTime;
        }
        return prevTime + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizState, totalTime]);


  const handleAnswerSelect = (questionIndex: number, answer: any) => {
    const q = quiz?.questions[questionIndex];
    if (!q) return;

    const inQuizMode = quiz?.quizType === 'quiz';
    const isAlreadyAnswered = userAnswers[questionIndex] !== '' && userAnswers[questionIndex] !== undefined && Object.keys(userAnswers[questionIndex]).length > 0;

    // In quiz mode, don't allow changing answers and update progress
    if (inQuizMode && isAlreadyAnswered) return;

    setUserAnswers(prev => ({
        ...prev,
        [questionIndex]: answer
    }));

    if (inQuizMode) {
      let isCorrect = false;
      if (q.type === 'mcq') {
        isCorrect = answer === q.correctAnswer;
      }
      
      if (isCorrect) {
        const progressIncrease = (q.marks / (quiz.totalMarks || 1)) * 100;
        setQuizProgress(prev => Math.min(100, prev + progressIncrease));
      } else {
        setQuizProgress(prev => Math.max(0, prev - 1));
      }
    }
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
    const questionIndex = currentQuestionIndex;
    const question = quiz?.questions[questionIndex];
    if (!question) return;

    setUserAnswers(prev => {
      const newAnswers = {...prev};
      if (question.type === 'mcq' || question.type === 'numerical') {
        newAnswers[questionIndex] = '';
      } else if (question.type === 'match') {
        newAnswers[questionIndex] = {};
      }
      return newAnswers;
    });
  };

  const handleMarkForReview = () => {
    const newMarked = [...markedForReview];
    newMarked[currentQuestionIndex] = !newMarked[currentQuestionIndex];
    setMarkedForReview(newMarked);
  }

  const calculateScore = useCallback(() => {
    if (!quiz) return 0;
    let totalObtainedMarks = 0;
    
    quiz.questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        let isCorrect = false;
        
        if (q.type === 'mcq' && userAnswer === q.correctAnswer) {
            isCorrect = true;
        } else if (q.type === 'numerical' && Number(userAnswer) === q.correctAnswer) {
            isCorrect = true;
        } else if (q.type === 'match') {
            const userMatches = userAnswer as { [key: string]: string };
            const isFullyCorrect = q.pairs.every(p => userMatches?.[p.item] === p.match);
            if (isFullyCorrect) {
                isCorrect = true;
            }
        }
        
        if (isCorrect) {
            totalObtainedMarks += q.marks;
        }
    });
    
    return Math.round((totalObtainedMarks / (quiz.totalMarks ?? 1)) * 100);
  }, [quiz, userAnswers]);


  const finishQuiz = async () => {
    if (!quiz || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save quiz results. User not logged in.',
      });
      return;
    }

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
        toast({
            variant: 'destructive',
            title: 'Save Error',
            description: "Could not save your quiz result to your profile."
        })
    }

    setQuizState('results');
  };

  const restartQuiz = () => {
    setQuiz(null);
    router.push('/quiz/create');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalQuestions = quiz?.questions.length ?? 0;
  const q = quiz?.questions[currentQuestionIndex];

  const completionProgress = useMemo(() => {
    if (!quiz || totalQuestions === 0) return 0;
    let answeredCount = 0;
    Object.keys(userAnswers).forEach(key => {
        const questionIndex = parseInt(key);
        const answer = userAnswers[questionIndex];
        const question = quiz.questions[questionIndex];

        if (question && question.type === 'match') {
            if (answer && typeof answer === 'object' && Object.keys(answer).length > 0) {
                 const allItemsMatched = question.pairs.every(pair => Object.keys(answer).includes(pair.item));
                 if (allItemsMatched) {
                    answeredCount++;
                 }
            }
        } else if (answer) {
            answeredCount++;
        }
    });
    return (answeredCount / totalQuestions) * 100;
  }, [userAnswers, totalQuestions, quiz]);

  const renderMCQ = (q: MCQ, questionIndex: number, isExam: boolean) => {
    const userAnswer = userAnswers[questionIndex] as string;
    const isAnswered = userAnswer !== '' && userAnswer !== undefined;
    const inQuizMode = quiz?.quizType === 'quiz';

    if (isExam) {
      return (
        <div>
          <p className="font-semibold mb-4">{quiz?.questions.indexOf(q) + 1}. {q.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {q.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <span className="mr-2 font-semibold">({String.fromCharCode(65 + index)})</span>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

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
                    const isCorrect = option === q.correctAnswer;
                    const isSelected = option === userAnswer;
                    const getOptionStyle = () => {
                      if (!inQuizMode || !isAnswered) return "border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer";
                      if (isSelected) {
                          return isCorrect ? "border-green-500 bg-green-100 text-green-900 font-semibold" : "border-red-500 bg-red-100 text-red-900 font-semibold";
                      }
                      if (isCorrect) {
                          return "border-green-500 bg-green-100 text-green-900";
                      }
                      return "border-gray-300 opacity-70 cursor-not-allowed";
                    };
                    return (
                        <FormItem key={index}>
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
                                <span className="flex-1">{option}</span>
                                {inQuizMode && isAnswered && isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                                {inQuizMode && isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                                {inQuizMode && isAnswered && !isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                            </FormLabel>
                        </FormItem>
                    );
                })}
            </RadioGroup>
        </>
    );
  };

  const renderMatch = (q: Match, questionIndex: number, isExam: boolean) => {
    const userMatches = userAnswers[questionIndex] as { [key: string]: string } || {};
    const items = q.pairs.map(p => p.item);
    const options = shuffledMatches[questionIndex] || [];
  
    if (isExam) {
      return (
        <div>
          <p className="font-semibold mb-4">{quiz?.questions.indexOf(q) + 1}. {q.question}</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="font-semibold border-b pb-2 mb-2">Column A</div>
              <ul className="list-decimal list-inside space-y-2">
                {items.map((item, index) => (
                  <li key={item + index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold border-b pb-2 mb-2">Column B</div>
               <ul className="list-[upper-alpha] list-inside space-y-2">
                {options.map((option, index) => (
                  <li key={option + index}>{option}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="font-semibold mb-4">{quiz?.questions.indexOf(q) + 1}. {q.question}</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="font-semibold">Column A</div>
          <div className="font-semibold">Column B</div>
          {items.map((item, index) => (
            <React.Fragment key={item + index}>
              <div className="p-3 border rounded-md bg-gray-50 flex items-center">{item}</div>
              <Select
                value={userMatches[item] || ''}
                onValueChange={(value) => {
                  const newMatches = {...userMatches, [item]: value};
                  handleAnswerSelect(questionIndex, newMatches);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a match" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option, optionIndex) => (
                    <SelectItem key={option + optionIndex} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  const renderNumerical = (q: Numerical, questionIndex: number, isExam: boolean) => {
    const userAnswer = userAnswers[questionIndex] as string;

    if (isExam) {
        return (
            <div>
                <p className="font-semibold mb-4">{quiz?.questions.indexOf(q) + 1}. {q.question}</p>
                <p className="text-muted-foreground mt-2">Answer: ____________</p>
            </div>
        )
    }

    return (
      <div>
        <p className="font-semibold mb-4">{quiz?.questions.indexOf(q) + 1}. {q.question}</p>
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => handleAnswerSelect(questionIndex, e.target.value)}
          placeholder="Enter your answer"
          className="max-w-xs"
        />
      </div>
    );
  };

  const renderQuestion = (q: Question, index: number, isExam = false) => {
    switch (q.type) {
        case 'mcq': return renderMCQ(q, index, isExam);
        case 'match': return renderMatch(q, index, isExam);
        case 'numerical': return renderNumerical(q, index, isExam);
        default: return <p>Unsupported question type.</p>;
    }
  }


  const renderExamPaper = () => {
    if (!quiz) return null;

    const mcqs = quiz.questions.filter(q => q.type === 'mcq');
    const matches = quiz.questions.filter(q => q.type === 'match');
    const numericals = quiz.questions.filter(q => q.type === 'numerical');

    return (
    <FormProvider {...form}>
     <div className="bg-white shadow-lg rounded-lg">
        <div className="p-4 sm:p-8">
            <div className="text-center p-2 bg-red-500 text-white font-semibold rounded-t-md">
                Nova learning help you achieve your achievements
            </div>
            <div className="border-2 border-dashed border-gray-400 p-4 sm:p-6 text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-red-600">
                    {`QuizNova (${quiz.board}) ${new Date().getFullYear()}`}
                </h1>
                <h2 className="text-lg sm:text-xl font-semibold mt-1">Question Paper</h2>
                <p className="text-sm sm:text-base mt-1">({quiz.subject}{quiz.subCategory ? ` - ${quiz.subCategory}` : ''})</p>
                <p className="text-sm sm:text-base font-bold text-blue-600 mt-2">{new Date(quiz.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                
                <div className="flex justify-between text-sm font-semibold mt-4">
                    <span>Time Allowed: {formatTime(totalTime)}</span>
                    <span>Max Marks: {quiz.totalMarks}</span>
                </div>

                <div className="text-left mt-6">
                    <h3 className="font-bold text-red-600 border-b-2 border-red-600 pb-1 inline-block">IMPORTANT INSTRUCTIONS:</h3>
                    <ol className="list-decimal list-inside text-xs sm:text-sm space-y-2 mt-2">
                        <li>The test is of {formatTime(totalTime)} duration.</li>
                        <li>This test paper consists of {totalQuestions} questions for a total of {quiz.totalMarks} marks.</li>
                        <li>Each question has marks assigned to it. There is no negative marking.</li>
                        <li>Attempt all questions.</li>
                        <li>This is a static paper. To submit, click the "Grade with AI" button at the bottom.</li>
                    </ol>
                </div>
            </div>
        </div>

        <div className="p-4 sm:p-8">
            {[
              { title: 'Multiple Choice Questions', questions: mcqs },
              { title: 'Match the Following', questions: matches },
              { title: 'Numerical Answer Questions', questions: numericals }
            ].map((section, secIndex) => (
                section.questions.length > 0 && (
                    <div key={secIndex}>
                        <h2 className="text-center font-bold text-lg bg-gray-200 p-2 rounded-md mb-4 uppercase">{section.title}</h2>
                        {section.questions.map(q => (
                            <div key={quiz.questions.indexOf(q)} className="mb-8 pb-4 border-b border-gray-200 flex justify-between items-start">
                               <div className="flex-1">
                                {renderQuestion(q, quiz.questions.indexOf(q), true)}
                               </div>
                               <div className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-md ml-4">
                                [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                               </div>
                            </div>
                        ))}
                    </div>
                )
            ))}
        </div>
        
        <div className="p-4 sm:p-8 flex justify-center">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">Grade with AI</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ready to Grade Your Exam?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be redirected to the AI grading page to upload your answers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        if (quiz?.quizType === 'exam') {
                           setQuizState('results');
                        }
                        router.push('/quiz/grade');
                    }}>Proceed</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
        </div>
    </div>
    </FormProvider>
    )
  }

  const renderContent = () => {
    switch (quizState) {
      case 'taking':
      case 'paused':
        if (!quiz || !q) return null;
        
        if (quiz.quizType === 'exam') {
            return renderExamPaper();
        }

        const isAnswered = userAnswers[currentQuestionIndex] !== '' && userAnswers[currentQuestionIndex] !== undefined;

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
              <div className="p-4 border-b space-y-3">
                 <Progress value={quiz.quizType === 'quiz' ? quizProgress : completionProgress} className="h-2" />
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={() => setQuizState('paused')}>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </Button>
                  <div className="flex items-center gap-2 font-medium">
                    <Clock className="h-5 w-5" />
                    <span>{formatTime(timeElapsed)}</span>
                    {totalTime > 0 && <span className="text-muted-foreground">/ {formatTime(totalTime)}</span>}
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

              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Question {currentQuestionIndex + 1}/{quiz.questions.length}
                  </p>
                   <div className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-md">
                    [{q.marks} Mark{q.marks > 1 ? 's' : ''}]
                   </div>
                </div>

                <div className="mb-6">
                  {renderQuestion(q, currentQuestionIndex, false)}
                </div>
                
                {quiz.quizType === 'quiz' && isAnswered && (
                  <Accordion type="single" collapsible className="w-full mt-4">
                    <AccordionItem value="explanation">
                      <AccordionTrigger>View Explanation</AccordionTrigger>
                      <AccordionContent>
                        {q.explanation}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

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
                      <Button onClick={handleClearSelection} variant="outline" className="flex-1 bg-red-100 text-red-700 border-red-200 hover:bg-red-200" disabled={!isAnswered}>
                          Clear
                      </Button>
                  </div>
                  
                  <Button onClick={handleNextQuestion} variant="default" disabled={currentQuestionIndex === quiz.questions.length - 1} className="md:flex-1 md:ml-2">
                     <span className="hidden md:inline">Save & Next</span>
                    <ArrowRight className="h-5 w-5 md:ml-2" />
                  </Button>
            </div>
          </FormProvider>
        );
      case 'results':
        if (!quiz) return null;

        // Because the exam is not interactive, we can't calculate a score.
        // We will just show the questions and their correct answers.
        if (quiz.quizType === 'exam') {
            return (
                <Card>
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-3xl">Exam Paper Review</CardTitle>
                        <CardDescription>Review the questions and their correct answers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {quiz.questions.map((q, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-left font-medium">Question {index + 1} ({q.type})</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-secondary/30 rounded-md">
                                        <p className="font-semibold">{q.question}</p>
                                        
                                        {q.type === 'mcq' && (
                                            <p className="mt-2 text-sm">
                                                Correct answer: <span className="font-semibold text-green-600">{q.correctAnswer}</span>
                                            </p>
                                        )}

                                        {q.type === 'numerical' && (
                                            <p className="mt-2 text-sm">
                                                Correct answer: <span className="font-semibold text-green-600">{q.correctAnswer}</span>
                                            </p>
                                        )}

                                        {q.type === 'match' && (
                                           <div>
                                             <p className="mt-2 text-sm font-semibold">Correct pairings:</p>
                                             <ul className="list-disc pl-5 mt-1 text-sm">
                                                {q.pairs.map(pair => (
                                                    <li key={pair.item}>
                                                        {pair.item} &rarr; <span className="font-semibold text-green-600">{pair.match}</span>
                                                    </li>
                                                ))}
                                             </ul>
                                           </div>
                                        )}

                                        <Separator className="my-3" />
                                        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Explanation:</span> {q.explanation}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        <Button onClick={restartQuiz} className="w-full mt-6">
                            Create Another Quiz
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return (
          <FormProvider {...form}>
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
                  let isCorrect = false;
                  let userFriendlyAnswer = "Not Answered";

                  if (q.type === 'mcq') {
                    isCorrect = userAnswer === q.correctAnswer;
                    userFriendlyAnswer = (userAnswer as string) || "Not Answered";
                  } else if (q.type === 'numerical') {
                    isCorrect = Number(userAnswer) === q.correctAnswer;
                    userFriendlyAnswer = (userAnswer as string) || "Not Answered";
                  } else if (q.type === 'match') {
                     const userMatches = userAnswer as { [key: string]: string };
                     isCorrect = userMatches ? q.pairs.every(p => userMatches[p.item] === p.match) : false;
                  }

                  return (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <span className="text-left font-medium">Question {index + 1} ({q.type})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-secondary/30 rounded-md">
                        <p className="font-semibold">{q.question}</p>
                        
                        {q.type === 'mcq' && (
                          <>
                            <p className="mt-2 text-sm">
                              Your answer: <span className={cn(isCorrect ? 'text-green-600' : 'text-destructive', 'font-semibold')}>{userFriendlyAnswer}</span>
                            </p>
                            {!isCorrect && (
                              <p className="mt-1 text-sm">
                                Correct answer: <span className="font-semibold text-green-600">{q.correctAnswer}</span>
                              </p>
                            )}
                          </>
                        )}

                        {q.type === 'numerical' && (
                          <>
                            <p className="mt-2 text-sm">
                              Your answer: <span className={cn(isCorrect ? 'text-green-600' : 'text-destructive', 'font-semibold')}>{userFriendlyAnswer}</span>
                            </p>
                            {!isCorrect && (
                              <p className="mt-1 text-sm">
                                Correct answer: <span className="font-semibold text-green-600">{q.correctAnswer}</span>
                              </p>
                            )}
                          </>
                        )}

                        {q.type === 'match' && (
                           <div>
                             <p className="mt-2 text-sm font-semibold">Your matches:</p>
                             <ul className="list-disc pl-5 mt-1 text-sm">
                                {q.pairs.map(pair => {
                                  const userMatch = (userAnswer as any)?.[pair.item];
                                  const isPairCorrect = userMatch === pair.match;
                                  return (
                                    <li key={pair.item}>
                                      {pair.item} &rarr; <span className={cn(isPairCorrect ? 'text-green-600' : 'text-destructive', 'font-semibold')}>{userMatch || 'Not answered'}</span>
                                      {!isPairCorrect && <span className="text-green-600 font-semibold"> (Correct: {pair.match})</span>}
                                    </li>
                                  )
                                })}
                             </ul>
                           </div>
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
          </FormProvider>
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
        <div className="w-full max-w-4xl pb-20 md:pb-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
