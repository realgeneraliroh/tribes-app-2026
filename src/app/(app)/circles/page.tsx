"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Link2, Loader2, Heart, PlusCircle, ArrowRight, Tent, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Bond, Tribe } from '@/lib/types';
import { getBonds } from '@/lib/actions/bond-actions';
import { getMyTribesList } from '@/lib/actions/content-actions';
import { useUser } from '@/hooks/use-user';

export default function CirclesPage() {
  const [activeTab, setActiveTab] = useState<'bonds' | 'tribes'>('bonds');
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [tribes, setTribes] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { role } = useUser();

  useEffect(() => {
    async function fetchData() {
      const [bondsResult, tribesResult] = await Promise.all([
        getBonds(),
        getMyTribesList(),
      ]);
      setBonds(bondsResult);
      setTribes(tribesResult);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredBonds = bonds.filter(b =>
    b.targetName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTribes = tribes.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const innerCircleBonds = filteredBonds.filter(b => b.innerCircle);
  const otherBonds = filteredBonds.filter(b => !b.innerCircle);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-normal text-foreground font-mono">Circles</h1>
        <p className="text-md md:text-lg text-muted-foreground mt-1">
          Your bonds and tribes — all your people in one place.
        </p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bonds and tribes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('bonds')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'bonds'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link2 className="inline-block mr-1.5 h-4 w-4" /> Bonds
          <Badge variant="secondary" className="ml-1.5 text-xs">{bonds.length}</Badge>
        </button>
        <button
          onClick={() => setActiveTab('tribes')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'tribes'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Tent className="inline-block mr-1.5 h-4 w-4" /> Tribes
          <Badge variant="secondary" className="ml-1.5 text-xs">{tribes.length}</Badge>
        </button>
      </div>

      {/* Bonds Tab */}
      {activeTab === 'bonds' && (
        <div className="space-y-6">
          {/* Inner Circle Section */}
          {innerCircleBonds.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" /> Inner Circle
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {innerCircleBonds.map(bond => (
                  <BondCard key={bond.id} bond={bond} />
                ))}
              </div>
            </section>
          )}

          {/* All Other Bonds */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> All Bonds
            </h2>
            {otherBonds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherBonds.map(bond => (
                  <BondCard key={bond.id} bond={bond} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-8 shadow-none border-dashed">
                <CardContent className="p-4">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? 'No bonds match your search.' : 'No bonds yet. Share your referral link to start connecting!'}
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Legacy Link */}
          <div className="text-center">
            <Link href="/bonds" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              View full bond management table →
            </Link>
          </div>
        </div>
      )}

      {/* Tribes Tab */}
      {activeTab === 'tribes' && (
        <div className="space-y-4">
          {filteredTribes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTribes.map(tribe => (
                <Link key={tribe.id} href={`/tribes/${tribe.id}`} className="block group">
                  <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30">
                    <CardHeader className="pb-2 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Tent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{tribe.name}</CardTitle>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 shadow-none border-dashed">
              <CardContent className="p-4">
                <Tent className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? 'No tribes match your search.' : 'You haven\'t joined any tribes yet.'}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Link href="/discover">
              <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Discover Tribes
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function BondCard({ bond }: { bond: Bond }) {
  const initials = bond.targetName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const bondTypeColors: Record<string, string> = {
    family: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    friend: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    professional: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    acquaintance: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  };

  return (
    <Link href={bond.targetId ? `/profile/${bond.targetId}` : '/bonds'} className="block group">
      <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{bond.targetName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", bondTypeColors[bond.bondType] || '')}>
                  {bond.bondType}
                </Badge>
                {bond.innerCircle && (
                  <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
