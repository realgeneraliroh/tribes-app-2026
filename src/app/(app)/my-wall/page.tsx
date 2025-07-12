
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Lock, PlusCircle, Settings, Share2, Users } from "lucide-react";
import Image from "next/image";
import { CreatePostDialog, type PostFormValues } from '@/components/dialogs/create-post-dialog';
import type { TribePost } from '@/lib/types';
import { Badge } from '@/components/ui/badge';


// Placeholder for a Wall Item Card
const WallItemCard = ({ post }: { post: Partial<TribePost> & { sharedWith?: string[] } }) => (
  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col">
    <CardHeader>
      <CardTitle className="tracking-normal text-xl">{post.title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      {post.imageUrl &&
        <div className="relative aspect-video w-full overflow-hidden rounded-md border mb-4">
          <Image 
            src={post.imageUrl}
            alt={post.title || "Wall post image"}
            fill
            style={{ objectFit: 'cover' }}
            data-ai-hint={post.dataAiHintImage || "user content"}
          />
        </div>
      }
      <CardDescription>{post.content}</CardDescription>
    </CardContent>
    <CardFooter className="flex-col items-start gap-3">
        <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
        {post.sharedWith && post.sharedWith.length > 0 && (
            <div className="w-full pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Shared with:</p>
                <div className="flex flex-wrap gap-2">
                    {post.sharedWith.map(tribeName => (
                        <Badge key={tribeName} variant="secondary">{tribeName}</Badge>
                    ))}
                </div>
            </div>
        )}
    </CardFooter>
  </Card>
);


export default function MyWallPage() {
    const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
    const [wallPosts, setWallPosts] = useState<(Partial<TribePost> & { sharedWith?: string[] })[]>([
        { title: "My Latest Project", content: "Proud to share the launch of my new website! Let me know what you think.", imageUrl: `https://placehold.co/400x225.png`, dataAiHintImage: "website project design", sharedWith: ["AI Innovators", "Indie Game Devs"] },
        { title: "Thoughts on AI", content: "A blog post I wrote about the future of artificial intelligence.", imageUrl: `https://placehold.co/400x225.png`, dataAiHintImage: "artificial intelligence brain", sharedWith: ["AI Innovators"] },
        { title: "Hiking Adventure", content: "Some photos from my recent trip to the mountains. This is a private post, only visible to me.", imageUrl: `https://placehold.co/400x225.png`, dataAiHintImage: "mountain landscape hiking", sharedWith: [] },
    ]);


    const handlePostCreated = (newPostData: PostFormValues) => {
        const newPost: Partial<TribePost> & { sharedWith?: string[] } = {
            title: newPostData.title,
            content: newPostData.content,
            imageUrl: newPostData.image ? URL.createObjectURL(newPostData.image) : undefined,
            dataAiHintImage: newPostData.image ? 'user upload' : undefined,
            sharedWith: newPostData.tribes, // For now, we'll just use the tribe IDs as names
        };

        setWallPosts(prev => [newPost, ...prev]);
        
        console.log(`Post created. Shared with tribes: ${newPostData.tribes?.join(', ')}`);
        
        setIsCreatePostDialogOpen(false);
    };


  return (
    <>
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                <h1 className="text-4xl font-bold tracking-normal text-foreground font-mono">My Wall</h1>
                <p className="text-lg text-muted-foreground mt-1">
                    Your personal space to create and share content with your communities.
                </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsCreatePostDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add to Wall</Button>
                    {/* Add filters button here in a future step */}
                </div>
            </header>
        
            <Card>
                <CardHeader>
                <CardTitle>My Content</CardTitle>
                <CardDescription>All your posts, shared and private, live here. Use filters to sort your view.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallPosts.length > 0 ? (
                        wallPosts.map((post, index) => (
                            <WallItemCard key={`wall-post-${index}`} post={post} />
                        ))
                     ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground">Your wall is empty.</p>
                            <Button variant="link" className="mt-2" onClick={() => setIsCreatePostDialogOpen(true)}>Create your first post</Button>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
        <CreatePostDialog
            isOpen={isCreatePostDialogOpen}
            onOpenChange={setIsCreatePostDialogOpen}
            onPostCreated={handlePostCreated}
        />
    </>
  );
}
