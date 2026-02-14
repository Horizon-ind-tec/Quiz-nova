'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, History, FilePlus, TestTubeDiagonal, FileText, Swords, Hash, ArrowRight, ScanText, X, ImageIcon, FileText as FileIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { generateQuizAction, scanToQuizAction } from '@/app/actions';
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
  totalMarks: z.coerce.number({ required_error: "Total marks is required" }).min(5, "Total marks must be at least 5.").max(100, "Total marks can be at most 100."),
  numberOfQuestions: z.coerce.number({ required_error: "Number of questions is required" }).min(1, "Must have at least 1 question.").max(100, "Cannot exceed 100 questions."),
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
  
  // Room Code Logic
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Scan Logic
  const [scannedFile, setScannedFile] = useState<{ name: string; dataUri: string; type: 'image' | 'pdf' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      totalMarks: undefined,
      numberOfQuestions: undefined,
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

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    setIsJoining(true);
    router.push(`/Quiznova.Challenge/${roomCode.trim()}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Minimum 1MB check
    if (file.size < 1 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too small',
        description: 'Please upload a file larger than 1MB for clear AI analysis.',
      });
      return;
    }

    // Maximum 1GB check
    if (file.size > 1024 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Upload a file smaller than 1GB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setScannedFile({
          name: file.name,
          dataUri: event.target.result as string,
          type: file.type.startsWith('image/') ? 'image' : 'pdf',
        });
        toast({ title: "Notes Scanned!", description: "AI will now generate a quiz from your file." });
      }
    };
    reader.readAsDataURL(file);
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

    try {
      let result;
      let generationInput: FormValues;

      if (scannedFile) {
        // --- SCAN MODE ---
        result = await scanToQuizAction({
          mediaDataUri: scannedFile.dataUri,
          class: data.class,
          subject: data.subject,
          totalMarks: data.totalMarks,
          numberOfQuestions: data.numberOfQuestions,
        });
        generationInput = data;
      } else {
        // --- NORMAL MODE ---
        if (generationMode === 'new') {
            generationInput = { ...data };
            setLastQuizOptions(data);
        } else {
            if (!lastQuizOptions) {
                toast({ variant: 'destructive', title: 'No Previous Quiz', description: 'No previous quiz settings found.' });
                setIsLoading(false);
                return;
            }
            generationInput = { 
                ...lastQuizOptions, 
                quizType: data.quizType, 
                totalMarks: data.totalMarks, 
                numberOfQuestions: data.numberOfQuestions,
                timeLimit: data.timeLimit 
            };
        }

        result = await generateQuizAction({
          ...generationInput,
          subCategory: generationInput.subCategories?.join(', '),
          seed: Math.random(),
          timestamp: Date.now(),
        });
      }

      if (result && result.questions && result.questions.length > 0) {
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
        
        const finalTotalMarks = data.totalMarks || result.questions.reduce((sum, q) => sum + (q.marks || 0), 0);

        let timeLimitInSeconds: number;
        if (data.timeLimit && data.timeLimit > 0) {
            timeLimitInSeconds = data.timeLimit * 60;
        } else {
            const timePerMark = 90; 
            timeLimitInSeconds = finalTotalMarks * timePerMark;
        }

        const newQuiz: Quiz = {
          id: uuidv4(),
          subject: generationInput.subject || 'Scanned Content',
          class: generationInput.class || 'N/A',
          difficulty: generationInput.difficulty || 'medium',
          quizType: generationInput.quizType,
          subCategory: generationInput.subCategories?.join(', '),
          board: generationInput.board,
          chapter: generationInput.chapter || (scannedFile ? 'Scanned Notes' : ''),
          ncert: generationInput.ncert,
          totalMarks: finalTotalMarks,
          timeLimit: timeLimitInSeconds,
          questions: shuffledQuestions,
          createdAt: Date.now(),
        };
        setQuiz(newQuiz);
        router.push('/quiz/take');
      } else {
        throw new Error('AI failed to generate questions. Please try again.');
      }
    } catch (error) {
      console.error("Quiz creation error:", error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
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
          
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* AI Scan & Battle Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Battle with Friends */}
                <Card className="border-indigo-200 bg-indigo-50/30 overflow-hidden relative">
                    <CardHeader className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md">
                                <Swords className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-sm font-black uppercase tracking-tight">Quiz Duel</CardTitle>
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full border-indigo-200 text-indigo-600 font-black uppercase text-[10px] tracking-widest h-9 rounded-full bg-white">
                                        Join Battle
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="uppercase font-black tracking-tighter text-indigo-600 flex items-center gap-2">Join Battle</DialogTitle>
                                        <DialogDescription className="font-bold">Enter the 10-digit Room Code.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Input 
                                            placeholder="e.g. A7b2C9x1Z0" 
                                            className="h-12 text-center text-lg font-mono font-bold tracking-widest uppercase border-2"
                                            value={roomCode}
                                            onChange={(e) => setRoomCode(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleJoinRoom} disabled={!roomCode || isJoining} className="w-full h-12 bg-indigo-600 font-black uppercase tracking-widest">
                                            {isJoining ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enter Battle'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button asChild size="sm" className="w-full bg-indigo-600 font-black uppercase text-[10px] tracking-widest h-9 rounded-full">
                                <Link href="/challenge/create">Create Duel</Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* AI Notes Scanner */}
                <Card className="border-emerald-200 bg-emerald-50/30 overflow-hidden relative">
                    <CardHeader className="py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md">
                                <ScanText className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-sm font-black uppercase tracking-tight text-emerald-900">Scan Notes</CardTitle>
                        </div>
                        <div className="mt-4">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                            {scannedFile ? (
                                <div className="flex flex-col gap-2">
                                    <div className="bg-white border-2 border-emerald-200 rounded-xl p-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {scannedFile.type === 'image' ? <ImageIcon className="h-3 w-3 text-emerald-600 shrink-0" /> : <FileIcon className="h-3 w-3 text-emerald-600 shrink-0" />}
                                            <span className="text-[10px] font-bold truncate max-w-[100px]">{scannedFile.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50" onClick={() => setScannedFile(null)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <p className="text-[8px] font-black text-emerald-600 uppercase text-center animate-pulse">File Ready for AI</p>
                                </div>
                            ) : (
                                <Button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest h-9 rounded-full transition-all active:scale-95"
                                >
                                    Scan PDF/Handwritten
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <Card className="max-w-2xl mx-auto border-slate-200">
                <CardHeader>
                <CardTitle>{scannedFile ? 'Configure Scanned Quiz' : 'Create a New Assessment'}</CardTitle>
                <CardDescription>
                    {scannedFile 
                        ? 'Fill in the details below and Nova will generate a quiz based on your uploaded file.' 
                        : 'Select your preferences and let our AI generate a custom quiz or exam for you.'}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <div className={cn((generationMode === 'previous' && !scannedFile) && 'opacity-50 pointer-events-none')}>
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
                                                                    const current = field.value || [];
                                                                    const updated = checked
                                                                        ? [...current, sub.name]
                                                                        : current.filter(v => v !== sub.name);
                                                                    form.setValue('subCategories', updated, { shouldValidate: true });
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer">
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
                        
                        {!scannedFile && (
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
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <FormField
                                control={form.control}
                                name="totalMarks"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Marks</FormLabel>
                                    <FormControl>
                                    <Input 
                                        type="number" 
                                        min="5" 
                                        max="100" 
                                        placeholder="e.g., 20" 
                                        {...field} 
                                        value={field.value || ''} 
                                        onChange={e => field.onChange(e.target.valueAsNumber || undefined)} 
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="numberOfQuestions"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Questions</FormLabel>
                                    <FormControl>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        max="100" 
                                        placeholder="e.g., 10" 
                                        {...field} 
                                        value={field.value || ''} 
                                        onChange={e => field.onChange(e.target.valueAsNumber || undefined)} 
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="timeLimit"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Time Limit (Minutes, optional)</FormLabel>
                                <FormControl>
                                <Input type="number" min="1" placeholder="Auto-assigned if blank" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormDescription>If left blank, a time limit will be estimated based on the questions.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />


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

                    {!scannedFile && (
                        <FormItem>
                            <FormLabel>Assessment Type &amp; Source</FormLabel>
                            <RadioGroup
                                value={combinedSelection}
                                onValueChange={(value) => handleSelectionChange(value as CombinedSelection)}
                                className="grid grid-cols-2 gap-4"
                            >
                                {[
                                    { value: 'new-quiz', icon: TestTubeDiagonal, label: 'New Quiz', sub: 'Unique questions' },
                                    { value: 'previous-quiz', icon: History, label: 'Regenerate last test' },
                                    { value: 'new-exam', icon: FileText, label: 'Paper-style test' },
                                    { value: 'previous-exam', icon: History, label: 'Regenerate last exam' }
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
                                            {item.sub && <span className="text-xs text-muted-foreground">{item.sub}</span>}
                                        </FormLabel>
                                    </FormItem>
                                ))}
                            </RadioGroup>
                            <FormMessage />
                        </FormItem>
                    )}

                    <Button type="submit" className="w-full !mt-8" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Generating...' : (scannedFile ? 'Generate from Scan' : 'Generate')}
                    </Button>
                    </form>
                </FormProvider>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
