"use client";

import { SidebarProvider } from "@/ui/components/atoms/sidebar";
import { SidebarToggle } from "@/ui/components/organisms/SidebarToggle";
import type React from "react";
import { Toaster } from "sonner";
import { AdminModal } from "@/app/(admin)/admin/_components/AdminModal";
import { AppSidebar } from "@/ui/components/organisms/AppSidebar/AppSidebar";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="bg-background flex min-h-screen w-full min-w-0 pt-16">
        <AppSidebar navigationType="ADMIN" />
        <main className="min-w-0 flex-1">
          <div className="container mx-auto p-4">
            <SidebarToggle />
            <div className="pt-4">{children}</div>
          </div>
          <AdminModal />
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
