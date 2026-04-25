"use client";

import { SidebarProvider, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { WebSocketProvider } from "@/components/providers/websocket-provider";
import { UserProvider } from "@/components/providers/user-provider";
import { ComposeFAB } from "@/components/compose/compose-fab";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // SidebarProvider will now manage its own open/collapsed state using cookies.
  // No need for AppLayout to maintain 'open' state for the sidebar.
  return (
    <UserProvider>
      <WebSocketProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarRail />
          <SidebarInset className="flex flex-col flex-1">
            <AppHeader />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 bg-background">
              {children}
            </main>
          </SidebarInset>
          <ComposeFAB />
          <MobileTabBar />
        </SidebarProvider>
      </WebSocketProvider>
    </UserProvider>
  );
}
