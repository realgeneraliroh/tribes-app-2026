
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent as ShadDialogContent, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle, DialogDescription as ShadDialogDescription, DialogFooter as ShadDialogFooter
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent as ShadSheetContent, SheetHeader as ShadSheetHeader, SheetTitle as ShadSheetTitle, SheetDescription as ShadSheetDescription, SheetFooter as ShadSheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from '@/components/ui/scroll-area';

// Minimal Bond type definition for this component.
// In a real app, this should be imported from a shared types file.
export type BondType = "family" | "friend" | "professional" | "collaborator" | "follower" | "supporter";
export interface Bond {
  id: string;
  targetName: string;
  targetType: "user" | "tribe";
  bondType: BondType;
  showInIntercom?: boolean; // Added for notification setting
  // Other Bond properties are not strictly needed by this dialog for now.
}

interface BondSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bond: Bond | null;
}

export function BondSettingsDialog({ isOpen, onOpenChange, bond }: BondSettingsDialogProps) {
  const isMobile = useIsMobile();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    // Sync switch state if bond changes or isOpen becomes true with a new bond
    if (isOpen && bond) {
      setNotificationsEnabled(bond.showInIntercom ?? true);
    }
  }, [isOpen, bond]);


  if (!bond) {
    return null;
  }

  const handleSaveSettings = () => {
    console.log(`Settings for bond '${bond.targetName}' (ID: ${bond.id}): Notifications ${notificationsEnabled ? 'ON' : 'OFF'}`);
    // In a real app, you'd call an API here, e.g.:
    // await updateBondSettings(bond.id, { ...bond, showInIntercom: notificationsEnabled });
    // And potentially update the local state on the BondsPage if the main bonds array needs to reflect this change immediately.
    onOpenChange(false); // Close the dialog/sheet
  };

  const DialogContentComponent = isMobile ? ShadSheetContent : ShadDialogContent;
  const DialogHeaderComponent = isMobile ? ShadSheetHeader : ShadDialogHeader;
  const DialogTitleComponent = isMobile ? ShadSheetTitle : ShadDialogTitle;
  const DialogDescriptionComponent = isMobile ? ShadSheetDescription : ShadDialogDescription;
  const DialogFooterComponent = isMobile ? ShadSheetFooter : ShadDialogFooter;
  const RootComponent = isMobile ? Sheet : Dialog;

  const commonContent = (
    <>
      <DialogHeaderComponent>
        <DialogTitleComponent>Bond Settings: {bond.targetName}</DialogTitleComponent>
        <DialogDescriptionComponent>
          Manage preferences for your bond with {bond.targetName} ({bond.targetType === 'user' ? 'User' : 'Tribe'} - {getBondTypeDisplay(bond.bondType)}).
        </DialogDescriptionComponent>
      </DialogHeaderComponent>

      <div className="py-4 space-y-6 text-sm">
        <fieldset>
          <legend className="text-base font-semibold text-foreground mb-3">Notification Settings</legend>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <Label htmlFor={`notifications-${bond.id}`} className="cursor-pointer flex-1 text-sm">
              Receive notifications for this bond
            </Label>
            <Switch
              id={`notifications-${bond.id}`}
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              aria-label="Toggle notifications for this bond"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 px-1">
            Controls if updates from this bond appear in your Intercom feed.
          </p>
        </fieldset>
        {/* Future settings sections can be added here */}
      </div>

      <DialogFooterComponent className="pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
      </DialogFooterComponent>
    </>
  );

  // Helper to display bond type nicely, mirroring logic from bonds/page.tsx
  const getBondTypeDisplay = (bondType: BondType): string => {
    switch (bondType) {
      case "family": return "Family";
      case "friend": return "Friend";
      case "professional": return "Professional";
      case "collaborator": return "Collaborator";
      case "follower": return "Follower";
      case "supporter": return "Supporter";
      default: return bondType;
    }
  };

  if (isMobile) {
    return (
      <RootComponent open={isOpen} onOpenChange={onOpenChange}>
        <DialogContentComponent side="bottom" className="h-auto max-h-[80vh] flex flex-col p-0">
            <ScrollArea className="flex-1">
                 <div className="p-4 sm:p-6">
                    {commonContent}
                 </div>
            </ScrollArea>
        </DialogContentComponent>
      </RootComponent>
    );
  }

  return (
    <RootComponent open={isOpen} onOpenChange={onOpenChange}>
      <DialogContentComponent className="sm:max-w-lg p-6">
        {commonContent}
      </DialogContentComponent>
    </RootComponent>
  );
}
