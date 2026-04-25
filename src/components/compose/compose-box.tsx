"use client";

import React, { useState, useRef, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { RingSelector } from './ring-selector';
import { MoodTagSelector } from './mood-tag-selector';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { createRingPost } from '@/lib/actions/content-actions';
import type { Ring } from '@/lib/types';
import { ImagePlus, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'tribes_last_ring';

interface ComposeBoxProps {
  onPostCreated?: () => void;
  defaultRing?: Ring;
  defaultTribeId?: string;
  className?: string;
}

export function ComposeBox({
  onPostCreated,
  defaultRing,
  defaultTribeId,
  className,
}: ComposeBoxProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ring state
  const savedRing = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) as Ring | null : null;
  const [ring, setRing] = useState<Ring>(defaultRing ?? savedRing ?? 'my_people');
  const [selectedTribeIds, setSelectedTribeIds] = useState<string[]>(
    defaultTribeId ? [defaultTribeId] : []
  );

  // Content state
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const initials = (user?.name ?? 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleSubmit = () => {
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        await createRingPost({
          content: content.trim(),
          ring,
          moodTag: moodTag ?? undefined,
          imageUrl: imageUrl ?? undefined,
          tribeIds: ring === 'tribes' ? selectedTribeIds : undefined,
        });

        // Reset
        setContent('');
        setMoodTag(null);
        setImageUrl(null);
        setIsExpanded(false);

        toast({
          title: 'Posted!',
          description: ring === 'journal'
            ? 'Added to your journal.'
            : `Shared with your ${ring === 'inner_circle' ? 'Inner Circle' : ring === 'my_people' ? 'People' : 'Tribes'}.`,
        });

        onPostCreated?.();
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Post failed',
          description: err instanceof Error ? err.message : 'Something went wrong.',
        });
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setImageUrl(data.url);
    } catch {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload image.' });
    }
  };

  return (
    <Card className={cn("border shadow-sm", className)}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name ?? 'You'} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {!isExpanded ? (
              /* Collapsed state — click to expand */
              <button
                onClick={() => {
                  setIsExpanded(true);
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                className="w-full text-left text-sm text-muted-foreground bg-muted/40 hover:bg-muted/60 rounded-lg px-3 py-2.5 transition-colors"
              >
                What&apos;s on your mind?
              </button>
            ) : (
              /* Expanded state — full compose form */
              <div className="space-y-2.5">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    ring === 'journal'
                      ? 'Write in your journal...'
                      : ring === 'inner_circle'
                        ? 'Share with your Inner Circle...'
                        : ring === 'my_people'
                          ? 'Share with your People...'
                          : 'Share with your Tribes...'
                  }
                  className="min-h-[80px] text-sm border-0 p-0 resize-none focus-visible:ring-0 shadow-none"
                  autoFocus
                />

                {/* Image preview */}
                {imageUrl && (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Upload preview" className="h-20 rounded-md object-cover" />
                    <button
                      onClick={() => setImageUrl(null)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Controls bar */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t">
                  <div className="flex items-center gap-1">
                    <RingSelector
                      value={ring}
                      onChange={setRing}
                      selectedTribeIds={selectedTribeIds}
                      onTribeIdsChange={setSelectedTribeIds}
                      defaultTribeId={defaultTribeId}
                    />
                    <MoodTagSelector value={moodTag} onChange={setMoodTag} />

                    {/* Image upload */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <div className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => {
                        setIsExpanded(false);
                        setContent('');
                        setMoodTag(null);
                        setImageUrl(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-8 gap-1"
                      disabled={!content.trim() || isPending || (ring === 'tribes' && selectedTribeIds.length === 0)}
                      onClick={handleSubmit}
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
