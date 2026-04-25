'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTribeByInviteToken, requestToJoinTribe } from '@/lib/actions/tribe-actions';
import type { Tribe } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Shield, ArrowRight, XCircle } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getTribeByInviteToken(token)
      .then(t => {
        setTribe(t);
        if (!t) setError('This invite link is invalid or has expired.');
      })
      .catch(() => setError('Failed to load invite.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (!tribe) return;
    setJoining(true);
    try {
      const result = await requestToJoinTribe(tribe.id);
      if (result === 'joined') {
        router.push(`/t/${tribe.slug}`);
      } else if (result === 'pending') {
        setError('Your request to join has been submitted. The tribe admins will review it.');
        setJoining(false);
      } else {
        setError('You do not meet the requirements to join this tribe.');
        setJoining(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join tribe.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !tribe) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-destructive/30">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive/60 mx-auto" />
            <h2 className="text-xl font-semibold">Invalid Invite</h2>
            <p className="text-muted-foreground">
              {error || 'This invite link is no longer valid. Ask the tribe founder for a new one.'}
            </p>
            <Button variant="outline" onClick={() => router.push('/tribes')}>
              Browse Tribes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-3">
          {tribe.cover && (
            <div
              className="w-full h-32 rounded-t-lg bg-cover bg-center -mt-6 -mx-6 mb-2"
              style={{
                backgroundImage: `url(${tribe.cover})`,
                width: 'calc(100% + 3rem)',
                backgroundPosition: tribe.coverPosition || 'center',
              }}
            />
          )}
          <CardTitle className="text-2xl">{tribe.name}</CardTitle>
          <CardDescription className="text-base">{tribe.description}</CardDescription>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {tribe.members} members
            </span>
            {!tribe.isPublic && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" /> Private
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You&apos;ve been invited to join this tribe.
          </p>
          <Button
            className="w-full"
            size="lg"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</>
            ) : (
              <>Join {tribe.name} <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
