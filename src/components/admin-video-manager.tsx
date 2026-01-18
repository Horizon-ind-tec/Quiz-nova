
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import type { Video } from '@/lib/types';
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
  subject: z.string().min(1, 'Please select a subject.'),
  subCategory: z.string().optional(),
  chapter: z.string().min(1, 'Chapter is required.'),
});

type VideoFormData = z.infer<typeof videoSchema>;

export function AdminVideoManager() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const videosQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'videos'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: videos, loading: videosLoading } = useCollection<Video>(videosQuery);


  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: { title: '', youtubeUrl: '', class: '', subject: '', subCategory: '', chapter: '' },
  });

  const selectedSubjectName = form.watch('subject');
  const selectedSubject = SUBJECTS_DATA.find(s => s.name === selectedSubjectName);

  useEffect(() => {
    if (editingVideo) {
      form.reset({
        title: editingVideo.title,
        youtubeUrl: editingVideo.youtubeUrl,
        class: editingVideo.class,
        subject: editingVideo.subject,
        subCategory: editingVideo.subCategory || '',
        chapter: editingVideo.chapter,
      });
    } else {
      form.reset({ title: '', youtubeUrl: '', class: '', subject: '', subCategory: '', chapter: '' });
    }
  }, [editingVideo, form]);
  
  useEffect(() => {
     if (isDialogOpen === false) {
        setEditingVideo(null);
     }
  }, [isDialogOpen])
  
  useEffect(() => {
    form.setValue('subCategory', '');
  }, [selectedSubjectName, form]);

  const onSubmit = async (data: VideoFormData) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      if (editingVideo) {
        const videoRef = doc(firestore, 'videos', editingVideo.id);
        await updateDoc(videoRef, data as any); // Cast to any to avoid type issues with optional fields
        toast({ title: 'Success', description: 'Video updated successfully.' });
      } else {
        await addDoc(collection(firestore, 'videos'), {
          ...data,
          createdAt: Date.now(),
          views: 0,
          likes: [],
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

  const isLoading = videosLoading;

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
                    <FormField control={form.control} name="subject" render={({ field }) => (
                       <FormItem>
                         <FormLabel>Subject</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger></FormControl>
                           <SelectContent>{SUBJECTS_DATA.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )} />
                 </div>
                 {selectedSubject && selectedSubject.subCategories && (
                    <FormField control={form.control} name="subCategory" render={({ field }) => (
                       <FormItem>
                         <FormLabel>{selectedSubject.name} Category</FormLabel>
                         <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder={`Select ${selectedSubject.name} category...`} /></SelectTrigger></FormControl>
                           <SelectContent>{selectedSubject.subCategories.map(sc => <SelectItem key={sc.name} value={sc.name}>{sc.name}</SelectItem>)}</SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )} />
                 )}
                 <FormField
                  control={form.control}
                  name="chapter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter</FormLabel>
                      <FormControl><Input placeholder="e.g., Photosynthesis" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    <div key={video.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border p-3 gap-2">
                        <div className="flex items-center gap-3">
                            <Youtube className="h-6 w-6 text-red-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">{video.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    {video.subject} {video.subCategory ? `- ${video.subCategory}` : ''} - {video.class}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
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
