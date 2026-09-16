"use client";

import { SidebarProvider } from "@/ui/components/atoms/sidebar";
import { SidebarToggle } from "@/ui/components/organisms/SidebarToggle";
import { AppSidebar } from "@/ui/components/organisms/AppSidebar/AppSidebar";
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="bg-background flex min-h-screen w-full min-w-0 pt-16">
        <AppSidebar navType="MY_PROFILE" />
        <main className="min-w-0 flex-1">
          <div className="container mx-auto p-4">
            <SidebarToggle />
            <div className="pt-4">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
