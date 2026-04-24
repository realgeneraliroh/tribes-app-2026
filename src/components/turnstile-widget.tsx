/**
 * @fileoverview Cloudflare Turnstile widget using official @marsidev/react-turnstile.
 * Supports imperative reset via ref for retrying after failed submissions.
 */

'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerified: (token: string) => void;
  onError?: () => void;
  onExpired?: () => void;
  className?: string;
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerified, onError, onExpired, className }, ref) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const instanceRef = useRef<TurnstileInstance | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => instanceRef.current?.reset(),
    }));

    if (!siteKey) return null;

    return (
      <Turnstile
        ref={instanceRef}
        siteKey={siteKey}
        onSuccess={onVerified}
        onError={onError}
        onExpire={onExpired}
        options={{ theme: 'auto', size: 'flexible' }}
        className={className}
      />
    );
  }
);
