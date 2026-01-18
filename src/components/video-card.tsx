
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { YoutubeEmbed } from '@/components/youtube-embed';
import { ThumbsUp, MessageSquare, Eye, Send } from 'lucide-react';
import type { Video, Comment } from '@/lib/types';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, collection, addDoc, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  // --- Like/View Logic ---
  const hasLiked = video.likes?.includes(user?.uid ?? '');
  
  // Increment view count once per component mount
  useEffect(() => {
    if (firestore && video.id) {
      const videoRef = doc(firestore, 'videos', video.id);
      updateDoc(videoRef, {
        views: increment(1)
      }).catch(err => console.error("Failed to increment view count:", err));
    }
  }, [firestore, video.id]);

  const handleLike = async () => {
    if (!firestore || !user) return;
    const videoRef = doc(firestore, 'videos', video.id);
    await updateDoc(videoRef, {
      likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  // --- Comment Logic ---
  const commentsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'videos', video.id, 'comments'), orderBy('createdAt', 'desc')) : null,
    [firestore, video.id]
  );
  const { data: comments } = useCollection<Comment>(commentsQuery);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !newComment.trim()) return;

    const commentsColRef = collection(firestore, 'videos', video.id, 'comments');
    await addDoc(commentsColRef, {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      text: newComment,
      createdAt: Date.now(),
    });
    setNewComment('');
  };


  return (
    <Card>
      <CardContent className="p-0">
        <YoutubeEmbed url={video.youtubeUrl} />
      </CardContent>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold">{video.title}</h3>
        <p className="text-sm text-muted-foreground">
          {video.subject} - {video.chapter} ({video.class})
        </p>

        {/* --- Stats and Actions --- */}
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span className="text-xs">{video.views || 0}</span>
            </div>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-auto p-1" onClick={handleLike} disabled={!user}>
              <ThumbsUp className={cn('h-4 w-4', hasLiked && 'fill-current text-primary')} />
              <span className="text-xs">{video.likes?.length || 0}</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-auto p-1" onClick={() => setShowComments(!showComments)}>
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{comments?.length || 0}</span>
          </Button>
        </div>

        {/* --- Comments Section --- */}
        {showComments && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Comments</h4>
            {user && (
              <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                />
                <Button type="submit" size="icon" disabled={!newComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
            <ScrollArea className="h-48">
              <div className="space-y-3 pr-4">
                {comments && comments.length > 0 ? comments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{comment.userName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm bg-muted p-2 rounded-md flex-1">
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold">{comment.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <p className="mt-1">{comment.text}</p>
                    </div>
                  </div>
                )) : <p className="text-xs text-muted-foreground text-center">No comments yet. Be the first!</p>}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </Card>
  );
}
