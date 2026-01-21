'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { SUBJECTS_DATA } from '@/lib/data';
import { generateStudyPlanAction } from '@/app/actions';
import { addDays } from 'date-fns';

const studyPlanSchema = z.object({
  examDate: z.date({ required_error: "Please select an exam date." }),
  selectedSubjects: z.array(z.string()).min(1, "Please select at least one subject."),
  chapters: z.record(z.string()).refine(
    (val, ctx) => {
        const { parent } = ctx;
        if (!parent.selectedSubjects) return true;
        return parent.selectedSubjects.every((subject: string) => val[subject] && val[subject].trim().length > 0);
    },
    {
        message: "Please list chapters for every selected subject.",
        path: ['chapters'],
    }
  ),
});

type StudyPlanFormData = z.infer<typeof studyPlanSchema>;

interface StudyPlanDialogProps {
    onOpenChange: (open: boolean) => void;
}

export function StudyPlanDialog({ onOpenChange }: StudyPlanDialogProps) {
    const { user } = useUser();
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

    const onSubmit = async (data: StudyPlanFormData) => {
        if (!user) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }

        setIsLoading(true);
        try {
            const subjectsPayload = data.selectedSubjects.map(subjectName => ({
                name: subjectName,
                chapters: data.chapters[subjectName].split(',').map(c => c.trim()).filter(Boolean),
            }));

            await generateStudyPlanAction({
                examDate: data.examDate,
                subjects: subjectsPayload,
                userId: user.uid,
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
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Create Your AI Study Plan</DialogTitle>
                <DialogDescription>
                    Set your exam date, select your subjects, and list the chapters you need to cover.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <FormField
                                control={form.control}
                                name="examDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col items-center">
                                        <FormLabel className="text-center w-full">1. Select Your Exam Date</FormLabel>
                                        <FormControl>
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < addDays(new Date(), 1)}
                                                initialFocus
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>2. Select Subjects</FormLabel>
                            <ScrollArea className="h-72 w-full rounded-md border p-4">
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
                                                                <FormLabel className="font-normal">{item.name}</FormLabel>
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
                    </div>
                    {watchedSubjects && watchedSubjects.length > 0 && (
                        <div className="space-y-2">
                            <FormLabel>3. List Chapters for Each Subject (comma-separated)</FormLabel>
                             <FormField
                                control={form.control}
                                name="chapters"
                                render={() => (
                                    <ScrollArea className="h-48 w-full">
                                    <div className="space-y-4 pr-4">
                                        {watchedSubjects.map(subject => (
                                            <FormField
                                                key={subject}
                                                control={form.control}
                                                name={`chapters.${subject}` as const}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-semibold">{subject}</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder={`e.g., Chapter 1: The Living World, Chapter 2: Biological Classification...`} {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                    </ScrollArea>
                                )}
                             />
                             <FormMessage>{form.formState.errors.chapters?.message}</FormMessage>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate My Study Plan
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    );
}
