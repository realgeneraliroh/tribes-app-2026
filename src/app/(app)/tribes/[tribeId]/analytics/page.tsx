
"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Users, MessageSquare, TrendingUp, BarChart2 as BarChartIcon, ShieldAlert } from 'lucide-react';
import { AreaChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Area, Bar, ResponsiveContainer } from 'recharts';
import { tribesData, type Tribe } from '@/lib/data';
import { useUser } from '@/hooks/use-user';

// Mock data for analytics
const memberGrowthData = [
  { date: 'Jan', members: 65 },
  { date: 'Feb', members: 72 },
  { date: 'Mar', members: 80 },
  { date: 'Apr', members: 95 },
  { date: 'May', members: 110 },
  { date: 'Jun', members: 128 },
];

const engagementData = [
  { name: 'Post 1', vibes: 45, comments: 12 },
  { name: 'Post 2', vibes: 88, comments: 20 },
  { name: 'Post 3', vibes: 65, comments: 8 },
  { name: 'Post 4', vibes: 102, comments: 15 },
  { name: 'Post 5', vibes: 78, comments: 10 },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const tribeId = params.tribeId as string;
  const { role } = useUser();
  const [hasAccess, setHasAccess] = useState<boolean | undefined>(undefined);
  
  useEffect(() => {
    const canAccess = role === 'Admin' || role === 'Creator';
    setHasAccess(canAccess);
  }, [role]);

  const tribe = useMemo(() => tribesData.find(t => t.id === tribeId), [tribeId]);

  if (hasAccess === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)]">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="max-w-xl mx-auto mt-8 shadow-lg">
        <CardHeader className="text-center">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4"/>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription>You do not have the required permissions to view this page.</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
            <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!tribe) {
    // In a real app, you might show a loading state or a proper "not found" page
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height,4rem)-2rem)]">
            <p className="text-muted-foreground">Loading tribe information...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center mt-2">
        <Button variant="outline" size="sm" onClick={() => router.push(`/tribes/${tribeId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {tribe.name}
        </Button>
      </div>

      <header>
        <div className="flex items-center space-x-3">
          <BarChartIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-mono tracking-normal">Engagement Analytics</h1>
            <p className="text-lg text-muted-foreground mt-1">
              Insights for the <span className="font-semibold text-primary">{tribe.name}</span> tribe.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">This is a placeholder demonstrating the Creator Toolkit. Data is static.</p>
      </header>

      {/* Key Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tribe.members}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vibe Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2/10</div>
            <p className="text-xs text-muted-foreground">Trending positive</p>
          </CardContent>
        </Card>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
            <CardDescription>Total members over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={memberGrowthData}>
                <defs>
                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Area type="monotone" dataKey="members" stroke="hsl(var(--primary))" fill="url(#colorMembers)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Post Engagement</CardTitle>
            <CardDescription>Vibes vs. Comments on recent posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend />
                <Bar dataKey="vibes" fill="hsl(var(--primary))" name="Vibes" />
                <Bar dataKey="comments" fill="hsl(var(--secondary))" name="Comments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
