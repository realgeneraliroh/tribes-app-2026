
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
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Bond } from '@/lib/types'; // Import Bond from centralized location
import { AtSign, UserCheck, UserCog, Info as InfoIcon } from 'lucide-react';


interface BondSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bond: Bond | null;
  onSave: (updatedBond: Bond) => void;
}

const getBondTypeDisplay = (bondType: Bond["bondType"]): string => {
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

export function BondSettingsDialog({ isOpen, onOpenChange, bond, onSave }: BondSettingsDialogProps) {
  const isMobile = useIsMobile();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [yourPseudonym, setYourPseudonym] = useState("");
  const [theirPseudonymForYou, setTheirPseudonymForYou] = useState("");
  // tribeAssignedNickname is read-only here, just for display
  // const [tribeAssignedNickname, setTribeAssignedNickname] = useState(""); 

  useEffect(() => {
    if (isOpen && bond) {
      setNotificationsEnabled(bond.showInIntercom ?? true);
      setAllowChat(bond.allowChatInitiation ?? (bond.targetType === 'user' && !bond.keyType?.startsWith('event_')));
      setYourPseudonym(bond.pseudonym || "");
      if (bond.targetType === 'user') {
        setTheirPseudonymForYou(bond.targetPseudonymForMe || "");
      }
      // For tribe-assigned nickname, it's just displayed if present, not edited here.
      // setTribeAssignedNickname(bond.tribeAssignedNickname || "");
    } else if (!isOpen) {
      // Reset when dialog closes
      setYourPseudonym("");
      setTheirPseudonymForYou("");
      // setTribeAssignedNickname("");
    }
  }, [isOpen, bond]);


  if (!bond) {
    return null;
  }

  const handleSaveSettings = () => {
    if (bond) {
        const updatedBond: Bond = {
            ...bond,
            showInIntercom: notificationsEnabled,
            allowChatInitiation: allowChat,
            pseudonym: yourPseudonym.trim() || undefined,
            targetPseudonymForMe: bond.targetType === 'user' ? (theirPseudonymForYou.trim() || undefined) : undefined,
            // tribeAssignedNickname is not editable here, so it's not included in the update
        };
        onSave(updatedBond);
    }
    onOpenChange(false);
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
        <DialogTitleComponent>Bond Settings: <span className="italic font-semibold">{bond.targetName}</span></DialogTitleComponent>
        <DialogDescriptionComponent>
          Manage preferences for your bond with <span className="italic font-semibold">{bond.targetName}</span> ({bond.targetType === 'user' ? 'User' : 'Tribe'} - {getBondTypeDisplay(bond.bondType)}).
          {bond.keyType && bond.keyType !== 'standard' && (
            <span className="block mt-2 text-xs text-purple-600 font-medium p-2 bg-purple-500/10 rounded-md">
              This is an '{bond.keyType.replace(/_/g, ' ')}' key {bond.eventId ? `for event '${bond.eventId}'` : ''} {bond.accessTier ? `with '${bond.accessTier}' access` : ''}.
            </span>
          )}
        </DialogDescriptionComponent>
      </DialogHeaderComponent>

      <div className="py-4 space-y-6 text-sm">
        <fieldset>
          <legend className="text-base font-semibold text-foreground mb-3">Interaction Settings</legend>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <Label htmlFor={`notifications-${bond.id}`} className="cursor-pointer flex-1 text-sm">
                Receive Intercom updates for this bond
                </Label>
                <Switch
                id={`notifications-${bond.id}`}
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                aria-label="Toggle Intercom updates for this bond"
                />
            </div>
            {bond.targetType === 'user' && !bond.keyType?.startsWith('event_') && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <Label htmlFor={`allowChat-${bond.id}`} className="cursor-pointer flex-1 text-sm">
                    Allow <span className="italic font-semibold">{bond.targetName}</span> to initiate chat with you
                    </Label>
                    <Switch
                    id={`allowChat-${bond.id}`}
                    checked={allowChat}
                    onCheckedChange={setAllowChat}
                    aria-label={`Toggle allowing ${bond.targetName} to initiate chat with you`}
                    />
                </div>
            )}
          </div>
        </fieldset>

        <Separator />

        <fieldset>
            <legend className="text-base font-semibold text-foreground mb-3">Alias & Nickname Settings</legend>
            <div className="space-y-4">
                <div>
                    <Label htmlFor={`your-pseudonym-${bond.id}`} className="flex items-center mb-1.5">
                        <AtSign className="h-4 w-4 mr-2 text-primary"/>
                        Your Alias for <span className="italic font-semibold ml-1">{bond.targetName}</span>
                    </Label>
                    <Input
                        id={`your-pseudonym-${bond.id}`}
                        value={yourPseudonym}
                        onChange={(e) => setYourPseudonym(e.target.value)}
                        placeholder="e.g., TechGuru, ArtLover (optional)"
                        className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                        How you appear to this bond target if set. Leave blank to use your main profile name.
                    </p>
                </div>

                 {bond.targetType === 'user' && (
                    <div>
                        <Label htmlFor={`their-pseudonym-${bond.id}`} className="flex items-center mb-1.5">
                            <UserCheck className="h-4 w-4 mr-2 text-sky-600"/>
                            Their Alias for You (if known)
                        </Label>
                        <Input
                            id={`their-pseudonym-${bond.id}`}
                            value={theirPseudonymForYou}
                            onChange={(e) => setTheirPseudonymForYou(e.target.value)}
                            placeholder="e.g., CollaboratorX (optional)"
                            className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                            If <span className="italic font-semibold">{bond.targetName}</span> uses an alias for you, note it here.
                        </p>
                    </div>
                )}

                {bond.targetType === 'tribe' && bond.tribeAssignedNickname && (
                    <div className="p-3 rounded-lg border bg-muted/50">
                        <Label className="flex items-center mb-1">
                            <UserCog className="h-4 w-4 mr-2 text-orange-500"/>
                            Your Nickname in this Tribe
                        </Label>
                        <p className="text-sm font-semibold text-foreground pl-6">{bond.tribeAssignedNickname}</p>
                        <p className="text-xs text-muted-foreground mt-1 pl-6">
                            This nickname is assigned by the tribe leadership and cannot be changed here.
                        </p>
                    </div>
                )}
                 {bond.targetType === 'tribe' && !bond.tribeAssignedNickname && (
                     <div className="p-3 rounded-lg border border-dashed">
                        <Label className="flex items-center mb-1">
                            <InfoIcon className="h-4 w-4 mr-2 text-muted-foreground"/>
                            Tribe-Assigned Nickname
                        </Label>
                        <p className="text-xs text-muted-foreground pl-6">
                            This tribe has not assigned you a specific nickname.
                        </p>
                    </div>
                )}
            </div>
        </fieldset>
      </div>

      <DialogFooterComponent className="pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
      </DialogFooterComponent>
    </>
  );


  if (isMobile) {
    return (
      <RootComponent open={isOpen} onOpenChange={onOpenChange}>
        <DialogContentComponent side="bottom" className="h-auto max-h-[90vh] flex flex-col p-0">
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

