'use client';

import React, { useState, useMemo } from 'react';
import { useCollection } from '@/firebase';
import type { Video, Subject, Chapter } from '@/lib/types';
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
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: videos, loading: videosLoading } = useCollection<Video>(
    firestore ? query(collection(firestore, 'videos'), orderBy('createdAt', 'desc')) : null
  );
  const { data: subjects, loading: subjectsLoading } = useCollection<Subject>(
    firestore ? collection(firestore, 'subjects') : null
  );
  const { data: chapters, loading: chaptersLoading } = useCollection<Chapter>(
    firestore && selectedSubjectId ? collection(firestore, `subjects/${selectedSubjectId}/chapters`) : null
  );

  const subjectMap = useMemo(() => {
    return subjects?.reduce((acc, subject) => {
      acc[subject.id] = subject.name;
      return acc;
    }, {} as Record<string, string>) || {};
  }, [subjects]);

  const chapterMap = useMemo(() => {
    return chapters?.reduce((acc, chapter) => {
      acc[chapter.id] = chapter.name;
      return acc;
    }, {} as Record<string, string>) || {};
  }, [chapters]);


  const filteredVideos = useMemo(() => {
    return (videos || []).filter(video => {
      const classMatch = selectedClass ? video.class === selectedClass : true;
      const subjectMatch = selectedSubjectId ? video.subjectId === selectedSubjectId : true;
      const chapterMatch = selectedChapterId ? video.chapterId === selectedChapterId : true;
      const searchMatch = searchTerm
        ? video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (subjectMap[video.subjectId] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (chapterMap[video.chapterId] || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return classMatch && subjectMatch && chapterMatch && searchMatch;
    });
  }, [videos, selectedClass, selectedSubjectId, selectedChapterId, searchTerm, subjectMap, chapterMap]);

  const isLoading = videosLoading || subjectsLoading || chaptersLoading;

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
              <SelectItem value="">All Classes</SelectItem>
              {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubjectId} onValueChange={(value) => { setSelectedSubjectId(value); setSelectedChapterId(''); }}>
            <SelectTrigger><SelectValue placeholder="Filter by Subject..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Subjects</SelectItem>
              {subjects?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedChapterId} onValueChange={setSelectedChapterId} disabled={!selectedSubjectId}>
            <SelectTrigger><SelectValue placeholder="Filter by Chapter..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Chapters</SelectItem>
              {chapters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                    {subjectMap[video.subjectId]} - {chapterMap[video.chapterId]} ({video.class})
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
