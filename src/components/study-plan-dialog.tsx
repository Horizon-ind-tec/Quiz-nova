'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { SUBJECTS_DATA } from '@/lib/data';
import { generateStudyPlanAction } from '@/app/actions';
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfToday } from 'date-fns';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const studyPlanSchema = z.object({
  examDate: z.date({ required_error: "Please select an exam date." }),
  selectedSubjects: z.array(z.string()).min(1, "Please select at least one subject."),
  chapters: z.record(z.string()),
}).refine(
    (data) => {
        if (!data.selectedSubjects || data.selectedSubjects.length === 0) return true;
        return data.selectedSubjects.every((subject) => data.chapters[subject] && data.chapters[subject].trim().length > 0);
    },
    {
        message: "Please list chapters for every selected subject.",
        path: ["chapters"],
    }
);

type StudyPlanFormData = z.infer<typeof studyPlanSchema>;

interface StudyPlanDialogProps {
    onOpenChange: (open: boolean) => void;
}

export function StudyPlanDialog({ onOpenChange }: StudyPlanDialogProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<StudyPlanFormData>({
        resolver: zodResolver(studyPlanSchema),
        defaultValues: {
            examDate: undefined,
            selectedSubjects: [],
            chapters: {},
        },
    });

    const watchedSubjects = form.watch('selectedSubjects');
    const selectedDate = form.watch('examDate');

    // --- Slidable Date Picker Logic ---
    const today = startOfToday();
    const [activeMonth, setActiveMonth] = useState(startOfMonth(addDays(today, 1)));

    const nextTwelveMonths = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => startOfMonth(addDays(today, 30 * i)));
    }, []);

    const daysInActiveMonth = useMemo(() => {
        const start = startOfMonth(activeMonth);
        const end = endOfMonth(activeMonth);
        return eachDayOfInterval({ start, end });
    }, [activeMonth]);

    const handleDateSelect = (date: Date) => {
        form.setValue('examDate', date, { shouldValidate: true });
    };

    const onSubmit = async (data: StudyPlanFormData) => {
        if (!user || !firestore) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }

        setIsLoading(true);
        try {
            const subjectsPayload = data.selectedSubjects.map(subjectName => ({
                name: subjectName,
                chapters: data.chapters[subjectName].split(',').map(c => c.trim()).filter(Boolean),
            }));

            const newPlanData = await generateStudyPlanAction({
                examDate: data.examDate,
                subjects: subjectsPayload,
            });

            const planRef = doc(firestore, 'users', user.uid, 'studyPlans', newPlanData.id);
            await setDoc(planRef, {
                ...newPlanData,
                userId: user.uid,
            });

            // AURA SYSTEM: Create study plan → +30 Aura
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                points: increment(30)
            });

            toast({ title: "Success!", description: "Your AI study plan has been generated." });
            onOpenChange(false);
            router.push('/study-plan');

        } catch (error) {
            console.error("Failed to generate study plan:", error);
            toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Create Your AI Study Plan</DialogTitle>
                <DialogDescription>
                    Set your exam date using the slidable selector, select your subjects, and list the chapters you need to cover.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <FormLabel className="flex items-center gap-2 text-base">
                            <CalendarIcon className="h-4 w-4" />
                            1. Select Your Exam Date
                        </FormLabel>
                        
                        {/* Slidable Month Selector */}
                        <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-muted/30 p-2">
                            <div className="flex w-max space-x-2">
                                {nextTwelveMonths.map((month) => (
                                    <Button
                                        key={month.toISOString()}
                                        type="button"
                                        variant={isSameDay(startOfMonth(activeMonth), month) ? "default" : "outline"}
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() => setActiveMonth(month)}
                                    >
                                        {format(month, 'MMMM yyyy')}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>

                        {/* Slidable Day Selector */}
                        <ScrollArea className="w-full whitespace-nowrap rounded-md border p-2">
                            <div className="flex w-max space-x-2">
                                {daysInActiveMonth.map((day) => {
                                    const isDisabled = isBefore(day, addDays(today, 1));
                                    const isSelected = selectedDate && isSameDay(selectedDate, day);
                                    
                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all min-w-[60px]",
                                                isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50",
                                                isDisabled && "opacity-30 pointer-events-none grayscale"
                                            )}
                                            onClick={() => !isDisabled && handleDateSelect(day)}
                                        >
                                            <span className="text-xs uppercase font-medium">{format(day, 'EEE')}</span>
                                            <span className="text-xl font-bold">{format(day, 'dd')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                        <FormMessage>{form.formState.errors.examDate?.message}</FormMessage>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <FormLabel className="text-base">2. Select Subjects</FormLabel>
                            <ScrollArea className="h-64 w-full rounded-md border p-4 bg-card">
                               <FormField
                                    control={form.control}
                                    name="selectedSubjects"
                                    render={() => (
                                        <FormItem className="space-y-3">
                                            {SUBJECTS_DATA.map((item) => (
                                                <FormField
                                                    key={item.name}
                                                    control={form.control}
                                                    name="selectedSubjects"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem key={item.name} className="flex flex-row items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(item.name)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...(field.value || []), item.name])
                                                                                : field.onChange(field.value?.filter((value) => value !== item.name));
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal cursor-pointer">{item.name}</FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </FormItem>
                                    )}
                                />
                            </ScrollArea>
                             <FormMessage>{form.formState.errors.selectedSubjects?.message}</FormMessage>
                        </div>

                        <div className="space-y-2">
                            <FormLabel className="text-base">3. List Chapters (comma-separated)</FormLabel>
                            {watchedSubjects && watchedSubjects.length > 0 ? (
                                <ScrollArea className="h-64 w-full rounded-md border p-4 bg-card">
                                    <div className="space-y-4 pr-4">
                                        {watchedSubjects.map(subject => (
                                            <FormField
                                                key={subject}
                                                control={form.control}
                                                name={`chapters.${subject}` as const}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-semibold text-xs text-muted-foreground uppercase">{subject}</FormLabel>
                                                        <FormControl>
                                                            <Textarea 
                                                                placeholder={`Chapters for ${subject}...`} 
                                                                className="min-h-[80px] resize-none"
                                                                {...field} 
                                                                value={field.value || ''} 
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="h-64 flex items-center justify-center border rounded-md border-dashed text-muted-foreground text-center p-4">
                                    Select a subject first to list its chapters.
                                </div>
                            )}
                             <FormMessage>{form.formState.errors.chapters?.root?.message}</FormMessage>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-12 text-lg">
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Roadmap...</>
                            ) : (
                                "Generate My Study Plan"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    );
}
