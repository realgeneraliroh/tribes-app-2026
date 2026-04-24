"use client";

import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Verified profile badge — shown next to user/org names that have
 * the `isVerified` flag set (admin-controlled, org tier+).
 */
export function VerifiedBadge({ className, size = "md" }: VerifiedBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BadgeCheck
          className={cn(
            "inline-block text-blue-500 shrink-0",
            sizes[size],
            className,
          )}
          aria-label="Verified account"
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs font-medium">Verified Organization</p>
      </TooltipContent>
    </Tooltip>
  );
}
