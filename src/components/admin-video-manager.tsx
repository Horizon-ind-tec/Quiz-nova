'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { Video, Subject, Chapter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, Youtube } from 'lucide-react';
import { CLASSES, SUBJECTS_DATA } from '@/lib/data';
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

const videoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  youtubeUrl: z.string().url('Must be a valid YouTube URL.'),
  class: z.string().min(1, 'Please select a class.'),
  subjectId: z.string().min(1, 'Please select a subject.'),
  chapterId: z.string().min(1, 'Please select a chapter.'),
});

type VideoFormData = z.infer<typeof videoSchema>;

export function AdminVideoManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const { data: videos, loading: videosLoading } = useCollection<Video>(
    firestore ? query(collection(firestore, 'videos'), orderBy('createdAt', 'desc')) : null
  );
  const { data: subjects, loading: subjectsLoading } = useCollection<Subject>(
     firestore ? query(collection(firestore, 'subjects'), orderBy('name')) : null
  );
  
  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: { title: '', youtubeUrl: '', class: '', subjectId: '', chapterId: '' },
  });

  const selectedSubjectId = form.watch('subjectId');
  const { data: chapters, loading: chaptersLoading } = useCollection<Chapter>(
    firestore && selectedSubjectId ? query(collection(firestore, `subjects/${selectedSubjectId}/chapters`), orderBy('name')) : null
  );

  useEffect(() => {
    if (editingVideo) {
      form.reset({
        title: editingVideo.title,
        youtubeUrl: editingVideo.youtubeUrl,
        class: editingVideo.class,
        subjectId: editingVideo.subjectId,
        chapterId: editingVideo.chapterId,
      });
    } else {
      form.reset({ title: '', youtubeUrl: '', class: '', subjectId: '', chapterId: '' });
    }
  }, [editingVideo, form]);
  
  useEffect(() => {
     if (isDialogOpen === false) {
        setEditingVideo(null);
     }
  }, [isDialogOpen])
  
   // Reset chapter when subject changes
  useEffect(() => {
    form.setValue('chapterId', '');
  }, [selectedSubjectId, form]);

  const subjectMap = React.useMemo(() => {
    return subjects?.reduce((acc, subject) => {
      acc[subject.id] = subject.name;
      return acc;
    }, {} as Record<string, string>) || {};
  }, [subjects]);

  const chapterMap = React.useMemo(() => {
    return chapters?.reduce((acc, chapter) => {
      acc[chapter.id] = chapter.name;
      return acc;
    }, {} as Record<string, string>) || {};
  }, [chapters]);

  const onSubmit = async (data: VideoFormData) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      if (editingVideo) {
        const videoRef = doc(firestore, 'videos', editingVideo.id);
        await updateDoc(videoRef, data);
        toast({ title: 'Success', description: 'Video updated successfully.' });
      } else {
        await addDoc(collection(firestore, 'videos'), {
          ...data,
          createdAt: Date.now(),
        });
        toast({ title: 'Success', description: 'Video added successfully.' });
      }
      setIsDialogOpen(false);
      setEditingVideo(null);
    } catch (error) {
      console.error('Error submitting video:', error);
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'videos', videoId));
      toast({ title: 'Success', description: 'Video deleted successfully.' });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  const isLoading = videosLoading || subjectsLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Videos</CardTitle>
          <CardDescription>Add, edit, or remove coaching videos.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2" /> Add Video</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingVideo ? 'Edit Video' : 'Add a New Video'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Introduction to Algebra" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL</FormLabel>
                      <FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="class" render={({ field }) => (
                       <FormItem>
                         <FormLabel>Class</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger></FormControl>
                           <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )} />
                    <FormField control={form.control} name="subjectId" render={({ field }) => (
                       <FormItem>
                         <FormLabel>Subject</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger></FormControl>
                           <SelectContent>{subjects?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )} />
                 </div>
                 <FormField control={form.control} name="chapterId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubjectId || chaptersLoading}>
                        <FormControl><SelectTrigger>
                            <SelectValue placeholder={chaptersLoading ? "Loading..." : "Select chapter..."} />
                        </SelectTrigger></FormControl>
                        <SelectContent>{chapters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingVideo ? 'Save Changes' : 'Add Video'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
         {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
         ): (
            <div className="space-y-2">
                {videos && videos.length > 0 ? videos.map(video => (
                    <div key={video.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                            <Youtube className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="font-semibold">{video.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    {subjectMap[video.subjectId]} - {video.class}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingVideo(video); setIsDialogOpen(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the video.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(video.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                        </div>
                    </div>
                )) : (
                    <div className="flex h-48 items-center justify-center text-center">
                        <div>
                            <h3 className="text-lg font-semibold">No Videos Yet</h3>
                            <p className="text-muted-foreground">Click "Add Video" to get started.</p>
                        </div>
                    </div>
                )}
            </div>
         )}
      </CardContent>
    </Card>
  );
}
