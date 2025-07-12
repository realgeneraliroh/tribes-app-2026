
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Globe, Lock, PlusCircle, Edit, Share2, Settings } from "lucide-react";
import Image from "next/image";

// Placeholder for a Wall Item Card
const WallItemCard = ({ title, description, imageHint }: { title: string, description: string, imageHint: string }) => (
  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
    <CardHeader>
      <CardTitle className="tracking-normal">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="relative aspect-video w-full overflow-hidden rounded-md border mb-4">
        <Image 
          src={`https://placehold.co/400x225.png`}
          alt={title}
          fill
          style={{ objectFit: 'cover' }}
          data-ai-hint={imageHint}
        />
      </div>
      <CardDescription>{description}</CardDescription>
    </CardContent>
  </Card>
);

export default function MyWallPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-normal text-foreground font-mono">My Wall</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Your personal space. Curate what you share with different communities.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add to Wall</Button>
            <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Manage Walls</Button>
        </div>
      </header>
      
      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Public
          </TabsTrigger>
          <TabsTrigger value="private" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Private
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Public Wall</CardTitle>
              <CardDescription>This is what everyone sees. Grant access to tribes to let them view more.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <WallItemCard title="My Latest Project" description="Proud to share the launch of my new website! Let me know what you think." imageHint="website project design" />
                <WallItemCard title="Thoughts on AI" description="A blog post I wrote about the future of artificial intelligence." imageHint="artificial intelligence brain" />
                <WallItemCard title="Hiking Adventure" description="Some photos from my recent trip to the mountains." imageHint="mountain landscape hiking" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="private" className="mt-6">
           <Card>
            <CardHeader>
              <CardTitle>Private Wall</CardTitle>
              <CardDescription>Only you can see this wall. Use it for notes, drafts, or personal reminders.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Your private wall is empty.</p>
                <Button variant="link" className="mt-2">Add a private note</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
