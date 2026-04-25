
"use client";

import React from 'react';
import { Loader2 } from "lucide-react";
import { TribeDetailProvider, useTribeDetail } from '../../tribes/[tribeId]/tribe-detail-context';
import { TribeAdminDashboard } from '../../tribes/[tribeId]/tribe-admin-dashboard';
import { TribeHeroBanner } from '../../tribes/[tribeId]/tribe-hero-banner';
import { TribeFeedSection } from '../../tribes/[tribeId]/tribe-feed-section';
import { TribeDialogOrchestrator } from '../../tribes/[tribeId]/tribe-dialog-orchestrator';

function TribeDetailContent() {
  const { state } = useTribeDetail();

  if (state.isLoading || !state.tribe) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <TribeAdminDashboard />
      <TribeHeroBanner />
      <TribeFeedSection />
      <TribeDialogOrchestrator />
    </div>
  );
}

export default function TribeSlugPage() {
  return (
    <TribeDetailProvider>
      <TribeDetailContent />
    </TribeDetailProvider>
  );
}
