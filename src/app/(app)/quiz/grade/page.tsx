'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, CircleDotDashed, Loader2, Send, Trash2, Upload, SwitchCamera } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Quiz, GradeExamOutput, QuizAttempt, UserAnswers } from '@/lib/types';
import { gradeExamAction } from '@/app/actions';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';


type GradingState = 'capturing' | 'grading' | 'results';

const MAX_IMAGES = 7;
const GRADING_TIME = 50; // seconds

export default function GradeExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quiz] = useLocalStorage<Quiz | null>('currentQuiz', null);
  const { user } = useUser();
  const firestore = useFirestore();


  const [gradingState, setGradingState] = useState<GradingState>('capturing');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a ref for the stream to avoid re-renders and stale state issues
  const streamRef = useRef<MediaStream | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const [timer, setTimer] = useState(GRADING_TIME);
  const [gradingResult, setGradingResult] = useState<GradeExamOutput | null>(null);

  useEffect(() => {
    if (!quiz || quiz.quizType !== 'exam') {
      router.replace('/quiz/create');
    }
  }, [quiz, router]);
  
  // This effect runs once to get permissions and camera list.
  useEffect(() => {
    const getPermissionsAndDevices = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Your browser does not support camera access.' });
        return;
      }
      try {
        // Request permission
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        // Important: Stop the temporary stream immediately after getting permission.
        tempStream.getTracks().forEach(track => track.stop());

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const availableVideoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (availableVideoDevices.length > 0) {
          setVideoDevices(availableVideoDevices);
          // Prefer back camera
          let initialDeviceIndex = availableVideoDevices.findIndex(device => device.label.toLowerCase().includes('back'));
          if (initialDeviceIndex === -1) {
              initialDeviceIndex = 0; // Default to the first camera if no "back" camera is found
          }
          setCurrentDeviceIndex(initialDeviceIndex);
        } else {
           setHasCameraPermission(false);
           toast({ variant: 'destructive', title: 'Camera Error', description: 'No video cameras found on your device.' });
        }

      } catch (error) {
        console.error('Error accessing camera or enumerating devices:', error);
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getPermissionsAndDevices();

    // Cleanup function to stop the stream when the component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]); // Run only once

  // This effect manages the camera stream when the selected device changes.
  useEffect(() => {
    if (!hasCameraPermission || videoDevices.length === 0) {
      return;
    }
    
    // Flag to prevent updates after the component has unmounted
    let isCancelled = false;

    const startStream = async () => {
      // 1. Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      try {
        // 2. Get the new stream
        const deviceId = videoDevices[currentDeviceIndex].deviceId;
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } }
        });

        if (isCancelled) {
          // If component unmounted while we were getting the stream, stop it.
          newStream.getTracks().forEach(track => track.stop());
          return;
        }

        // 3. Update refs
        streamRef.current = newStream;
        if (videoRef.current) {
            videoRef.current.srcObject = newStream;
        }

      } catch (err) {
         console.error("Could not start video source:", err);
         toast({
            variant: "destructive",
            title: "Camera Error",
            description: "Could not start video source. It might be in use by another application or the device may be disconnected."
         });
         setHasCameraPermission(false);
      }
    };

    startStream();
    
    // Set the cancellation flag on cleanup
    return () => {
      isCancelled = true;
    };

  }, [currentDeviceIndex, videoDevices, hasCameraPermission, toast]);


  useEffect(() => {
    if (gradingState === 'grading' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gradingState, timer]);

  const handleSwitchCamera = () => {
      if (videoDevices.length > 1) {
          setCurrentDeviceIndex(prevIndex => (prevIndex + 1) % videoDevices.length);
      }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && capturedImages.length < MAX_IMAGES) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUri = canvas.toDataURL('image/jpeg');
      setCapturedImages(prev => [...prev, dataUri]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      let processedImages = 0;
      for (let i = 0; i < files.length && capturedImages.length + processedImages < MAX_IMAGES; i++) {
        const file = files[i];

        // Size checks: 1MB min, 1GB max
        if (file.size < 1 * 1024 * 1024) {
          toast({ variant: 'destructive', title: 'File too small', description: `${file.name} is smaller than 1MB.` });
          continue;
        }
        if (file.size > 1024 * 1024 * 1024) {
          toast({ variant: 'destructive', title: 'File too large', description: `${file.name} is larger than 1GB.` });
          continue;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setCapturedImages(prev => [...prev, e.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
        processedImages++;
      }
    }
  };

  const handleDeleteImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleGrade = async () => {
    if (!quiz || capturedImages.length === 0) {
       toast({
        variant: 'destructive',
        title: 'No Images',
        description: 'Please capture or upload at least one image of your answer sheet.',
      });
      return;
    }
     if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to save exam results.',
      });
      return;
    }
    
    setGradingState('grading');
    
    try {
      const result = await gradeExamAction({
        answerSheetImages: capturedImages,
        questions: quiz.questions,
      });

      const userAnswers: UserAnswers = {};
      result.gradedAnswers.forEach(ga => {
        userAnswers[ga.questionIndex] = ga.userAnswer;
      });

      const newExamAttempt: QuizAttempt = {
        ...quiz,
        id: uuidv4(), // Ensure a new unique ID for the attempt
        userAnswers,
        score: result.score,
        completedAt: Date.now(),
        userId: user.uid,
        completionTime: 0, // Not tracked for paper exams
      };

      const quizResultsRef = collection(firestore, 'users', user.uid, 'quiz_results');
      await addDoc(quizResultsRef, newExamAttempt);

      setGradingResult(result);
      setGradingState('results');

    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Grading Failed',
        description: (error as Error).message || 'An unknown error occurred while grading.',
      });
       setGradingState('capturing');
    }
  };

  const renderCapturing = () => (
    <Card>
      <CardHeader>
        <CardTitle>Grade Your Exam</CardTitle>
        <CardDescription>
          Use your camera to upload your answer sheets. You can upload up to {MAX_IMAGES} images (1MB to 1GB each).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCameraPermission === false && (
          <Alert variant="destructive">
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>
              Please enable camera permissions in your browser settings to use this feature, or upload files manually.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
           <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
           {hasCameraPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
           )}
           {videoDevices.length > 1 && (
             <Button
                variant="outline"
                size="icon"
                className="absolute bottom-2 right-2 rounded-full"
                onClick={handleSwitchCamera}
              >
                <SwitchCamera className="h-5 w-5" />
              </Button>
           )}
        </div>
       
        <div className="flex flex-col sm:flex-row gap-2">
           <Button onClick={handleCapture} disabled={capturedImages.length >= MAX_IMAGES || !hasCameraPermission} className="flex-1">
             <Camera className="mr-2 h-4 w-4" />
             Capture ({capturedImages.length}/{MAX_IMAGES})
           </Button>
           <Button onClick={() => fileInputRef.current?.click()} disabled={capturedImages.length >= MAX_IMAGES} variant="secondary" className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
           </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />
        </div>

        {capturedImages.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Captured Images:</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {capturedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <Image src={image} alt={`Capture ${index + 1}`} width={100} height={100} className="w-full h-auto rounded-md" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
             <Button onClick={handleGrade} className="w-full mt-4">
                <Send className="mr-2 h-4 w-4" />
                Grade My Answers
              </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderGrading = () => (
     <Card className="flex flex-col items-center justify-center p-8 text-center">
        <CircleDotDashed className="h-16 w-16 animate-spin text-primary mb-4" />
        <CardTitle className="text-2xl mb-2">Grading in Progress</CardTitle>
        <CardDescription className="mb-4">
          Our AI is analyzing your answers. Please wait.
        </CardDescription>
        <div className="w-full max-w-sm space-y-2">
          <Progress value={(GRADING_TIME - timer) / GRADING_TIME * 100} />
          <p className="text-sm text-muted-foreground">Time remaining: {timer}s</p>
        </div>
     </Card>
  );

  const renderResults = () => {
    if (!gradingResult) return null;
    const { score } = gradingResult;
    
    return (
       <Card>
        <CardHeader className="items-center text-center">
          <CardTitle className="text-3xl">Grading Complete!</CardTitle>
          <CardDescription>Your AI-graded score is</CardDescription>
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
           <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>AI Feedback</AlertTitle>
              <AlertDescription>
                {gradingResult.generalFeedback}
              </AlertDescription>
            </Alert>

          <Button onClick={() => router.push('/dashboard')} className="w-full mt-6">
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 p-2 pt-4 md:p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl">
          {gradingState === 'capturing' && renderCapturing()}
          {gradingState === 'grading' && renderGrading()}
          {gradingState === 'results' && renderResults()}
        </div>
      </main>
    </div>
  );
}
