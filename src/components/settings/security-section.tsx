import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

export function SecuritySection() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <CardTitle className="text-xl">Security &amp; Privacy</CardTitle>
        </div>
        <CardDescription>Manage your password, two-factor authentication, and privacy settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto">Change Password</Button>
          <Button variant="outline" className="w-full sm:w-auto">Setup Two-Factor Authentication</Button>
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-md border hover:bg-muted/50">
          <div className="min-w-0 flex-1">
            <Label htmlFor="dataSharing" className="font-medium">Allow AI Assistant Access to My Data</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Let the AI assistant use your public tribe information to provide more personalized help. Private data is never used.
            </p>
          </div>
          <Switch id="dataSharing" className="shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
