'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import type { Video } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { Loader2 } from 'lucide-react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { CLASSES, SUBJECTS_DATA } from '@/lib/data';

export function VideoLibrary() {
  const firestore = useFirestore();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const videosQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'videos'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: videos, loading: videosLoading } = useCollection<Video>(videosQuery);

  const subjectOptions = SUBJECTS_DATA;
  const subCategoryOptions = useMemo(() => {
    if (selectedSubject === 'all') return [];
    return SUBJECTS_DATA.find(s => s.name === selectedSubject)?.subCategories || [];
  }, [selectedSubject]);

  const filteredVideos = useMemo(() => {
    return (videos || []).filter(video => {
      const classMatch = selectedClass !== 'all' ? video.class === selectedClass : true;
      const subjectMatch = selectedSubject !== 'all' ? video.subject === selectedSubject : true;
      const subCategoryMatch = selectedSubCategory !== 'all' ? video.subCategory === selectedSubCategory : true;
      
      const searchMatch = searchTerm
        ? video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (video.subCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          video.chapter.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
        
      return classMatch && subjectMatch && subCategoryMatch && searchMatch;
    });
  }, [videos, selectedClass, selectedSubject, selectedSubCategory, searchTerm]);

  const isLoading = videosLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Library</CardTitle>
        <CardDescription>Find coaching videos to help you study and prepare for your quizzes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue placeholder="Filter by Class..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubject} onValueChange={(value) => { setSelectedSubject(value); setSelectedSubCategory('all'); }}>
            <SelectTrigger><SelectValue placeholder="Filter by Subject..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjectOptions.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory} disabled={subCategoryOptions.length === 0}>
            <SelectTrigger><SelectValue placeholder="Filter by Category..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {subCategoryOptions.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map(video => (
              <Card key={video.id}>
                <CardContent className="p-0">
                  <YoutubeEmbed url={video.youtubeUrl} />
                </CardContent>
                <div className="p-4">
                  <h3 className="font-semibold">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {video.subject} {video.subCategory ? `- ${video.subCategory}`: ''} - {video.chapter} ({video.class})
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold">No Videos Found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
