"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ComposeBox } from './compose-box';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ring } from '@/lib/types';

interface ComposeFABProps {
  onPostCreated?: () => void;
  className?: string;
}

/**
 * Floating Action Button for mobile compose.
 * Context-aware: pre-selects ring based on current route.
 */
export function ComposeFAB({ onPostCreated, className }: ComposeFABProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Context-aware ring defaulting
  let defaultRing: Ring = 'my_people';
  let defaultTribeId: string | undefined;

  if (pathname?.startsWith('/tribes/')) {
    defaultRing = 'tribes';
    defaultTribeId = pathname.split('/tribes/')[1]?.split('/')[0];
  } else if (pathname?.startsWith('/t/')) {
    defaultRing = 'tribes';
    // Slug-based route — tribe ID will be resolved by the selector
  } else if (pathname?.includes('my-wall') || pathname?.includes('my-space')) {
    defaultRing = 'journal';
  }

  return (
    <>
      {/* FAB button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-50 md:hidden",
          "h-14 w-14 rounded-full",
          "bg-primary text-primary-foreground",
          "shadow-lg shadow-primary/25",
          "flex items-center justify-center",
          "hover:bg-primary/90 active:scale-95",
          "transition-all duration-200",
          className,
        )}
        aria-label="Create post"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom sheet compose form */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-4 pt-4 pb-6">
          <SheetHeader className="mb-3">
            <SheetTitle className="text-lg">Create Post</SheetTitle>
            <SheetDescription className="sr-only">
              Write a new post and choose who can see it.
            </SheetDescription>
          </SheetHeader>
          <ComposeBox
            onPostCreated={() => {
              setOpen(false);
              onPostCreated?.();
            }}
            defaultRing={defaultRing}
            defaultTribeId={defaultTribeId}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
