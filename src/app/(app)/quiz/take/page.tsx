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
  BrainCircuit,
} from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

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
import { Progress } from '@/components/ui/progress';

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


  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    if (newAnswers[questionIndex] === '') { // Lock answer after first selection
        newAnswers[questionIndex] = answer;
        setUserAnswers(newAnswers);
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
      id: uuidv4(), // Assign a new unique ID for each attempt
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalQuestions = quiz?.questions.length ?? 0;

  const progress = useMemo(() => {
    if (!quiz || totalQuestions === 0) return 0;
    
    let correctSoFar = 0;
    userAnswers.forEach((answer, index) => {
      if (answer && answer === quiz.questions[index].correctAnswer) {
        correctSoFar++;
      }
    });
    
    if (totalQuestions === 0) return 0;

    return (correctSoFar / totalQuestions) * 100;
  }, [userAnswers, quiz, totalQuestions]);
  
  const renderExamPaper = () => {
    if (!quiz) return null;

    const sections = quiz.subCategory ? [quiz.subCategory] : [quiz.subject];
    const questionsPerSection = Math.ceil(quiz.questions.length / sections.length);

    return (
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
                    <span>Time: {formatTime(totalTime)}</span>
                    <span>M.M: {totalQuestions * 4}</span>
                </div>

                <div className="text-left mt-6">
                    <h3 className="font-bold text-red-600 border-b-2 border-red-600 pb-1 inline-block">IMPORTANT INSTRUCTIONS:</h3>
                    <ol className="list-decimal list-inside text-xs sm:text-sm space-y-2 mt-2">
                        <li>The test is of {formatTime(totalTime)} duration.</li>
                        <li>This test paper consists of {totalQuestions} questions.</li>
                        <li>Each question carries +4 marks for correct answer and -1 mark for wrong answer.</li>
                        <li>Attempt all questions.</li>
                        <li>Mark your answers in the provided interface. Once an answer is selected, it cannot be changed.</li>
                    </ol>
                </div>
            </div>
        </div>

        <div className="p-4 sm:p-8">
            {sections.map((section, secIndex) => (
                <div key={secIndex}>
                    <h2 className="text-center font-bold text-lg bg-gray-200 p-2 rounded-md mb-4 uppercase">{section}</h2>
                    {quiz.questions.slice(secIndex * questionsPerSection, (secIndex + 1) * questionsPerSection).map((q, qIndex) => {
                        const questionNumber = secIndex * questionsPerSection + qIndex + 1;
                        const userAnswer = userAnswers[questionNumber - 1];
                        const isAnswered = userAnswer !== '';

                        return (
                            <div key={questionNumber} className="mb-8 pb-4 border-b border-gray-200">
                                <p className="font-semibold mb-4">{questionNumber}. {q.question}</p>
                                <RadioGroup
                                  value={userAnswer}
                                  onValueChange={(value) => handleAnswerSelect(questionNumber - 1, value)}
                                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                >
                                    {q.options.map((option, index) => {
                                        const isCorrect = option === q.correctAnswer;
                                        const isSelected = option === userAnswer;

                                        const getOptionStyle = () => {
                                            if (!isAnswered) return "border-gray-300 hover:border-blue-500 hover:bg-blue-50";
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
                                                    <RadioGroupItem value={option} id={`q${questionNumber}-option-${index}`} className="sr-only" />
                                                </FormControl>
                                                <FormLabel
                                                    htmlFor={`q${questionNumber}-option-${index}`}
                                                    className={cn(
                                                        "flex items-center space-x-3 space-y-0 rounded-md border p-3 transition-all cursor-pointer",
                                                        getOptionStyle(),
                                                    )}
                                                >
                                                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <span className="flex-1">{option}</span>
                                                    {isAnswered && isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                                                    {isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                                                </FormLabel>
                                            </FormItem>
                                        );
                                    })}
                                </RadioGroup>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
        
        <div className="p-4 sm:p-8 flex justify-center">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">SUBMIT EXAM</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will end the exam and calculate your score. You cannot undo this action.
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
    )
  }


  const renderContent = () => {
    switch (quizState) {
      case 'taking':
      case 'paused':
        if (!quiz) return null;
        
        if (quiz.quizType === 'exam') {
            return renderExamPaper();
        }

        const currentQuestion = quiz.questions[currentQuestionIndex];
        const isAnswered = userAnswers[currentQuestionIndex] !== '';
        const userAnswer = userAnswers[currentQuestionIndex];

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
                 <Progress value={progress} className="h-2" />
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
                  value={userAnswer}
                  onValueChange={(value) => handleAnswerSelect(currentQuestionIndex, value)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const isSelected = option === userAnswer;
                    
                    const getOptionStyle = () => {
                      if (!isAnswered) return "cursor-pointer hover:bg-accent";
                      if (isSelected) {
                        return isCorrect ? "border-green-500 bg-green-100 text-green-800" : "border-red-500 bg-red-100 text-red-800";
                      }
                      if (isCorrect) {
                        return "border-green-500 bg-green-100 text-green-800";
                      }
                      return "cursor-not-allowed opacity-70";
                    };

                    const getIndicatorStyle = () => {
                       if (!isAnswered) return "border-gray-400 bg-white text-gray-600";
                       if (isSelected) {
                         return isCorrect ? "border-green-500 bg-green-500 text-white" : "border-red-500 bg-red-500 text-white";
                       }
                       if (isCorrect) {
                         return "border-green-500 bg-green-500 text-white";
                       }
                       return "border-gray-400 bg-white text-gray-600";
                    };

                    return (
                      <FormItem key={index}>
                        <FormControl>
                          <RadioGroupItem value={option} id={`option-${index}`} className="sr-only" />
                        </FormControl>
                        <FormLabel
                          htmlFor={`option-${index}`}
                          className={cn(
                            "flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-colors",
                             getOptionStyle(),
                          )}
                        >
                           <div className={cn(
                             "w-6 h-6 rounded-full border flex items-center justify-center shrink-0",
                             getIndicatorStyle()
                             )}>
                             {String.fromCharCode(65 + index)}
                           </div>
                          <span className="font-normal flex-1">{option}</span>
                          {isAnswered && (
                            <>
                              {isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                              {!isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                            </>
                          )}
                        </FormLabel>
                      </FormItem>
                    );
                  })}
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
                      <Button onClick={handleClearSelection} variant="outline" className="flex-1 bg-red-100 text-red-700 border-red-200 hover:bg-red-200" disabled={!isAnswered}>
                          Clear
                      </Button>
                  </div>
                  
                  <Button onClick={handleNextQuestion} variant="default" disabled={currentQuestionIndex === quiz.questions.length - 1} className="md:flex-1 md:ml-2">
                     <span className="hidden md:inline">Next</span>
                    <ArrowRight className="h-5 w-5 md:ml-2" />
                  </Button>
            </div>
          </FormProvider>
        );
      case 'results':
        if (!quiz) return null;
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
