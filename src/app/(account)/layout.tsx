"use client";

import { SidebarProvider } from "@/ui/components/atoms/sidebar";
import { SidebarToggle } from "@/ui/components/organisms/SidebarToggle";
import { AppSidebar } from "@/ui/components/organisms/AppSidebar/AppSidebar";
import { usePathname } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const navigationType = pathname.startsWith("/my-profile") ? "MY_PROFILE" : "MY_ORDER";

  return (
    <SidebarProvider>
      <div className="bg-background flex min-h-screen w-full min-w-0 pt-16">
        <AppSidebar navigationType={navigationType} />
        <main className="min-w-0 flex-1">
          <div className="container mx-auto px-4 pt-4 pb-20">
            <SidebarToggle />
            <div className="pt-4">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
