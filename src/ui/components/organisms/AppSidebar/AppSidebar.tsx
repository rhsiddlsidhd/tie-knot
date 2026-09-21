import { X } from "lucide-react";
import { Sidebar, useSidebar } from "@/ui/components/atoms/sidebar";
import { Logo } from "@/ui/components/atoms/logo";
import { SidebarNavMenu } from "@/ui/components/organisms/SidebarNavMenu";

interface AppSidebarProps {
  navigationType: "ADMIN" | "MY_PROFILE" | "MY_ORDER";
}

interface SidebarPanelProps {
  navigationType: "MAIN" | AppSidebarProps["navigationType"];
  onClose: () => void;
  onNavigate?: () => void;
}

const SidebarPanel = ({ navigationType, onClose, onNavigate }: SidebarPanelProps) => {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-6 pt-6 pb-0 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between">
          <span onClick={onNavigate}>
            <Logo />
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground -mr-1 p-1 transition-colors"
            aria-label="메뉴 닫기"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="bg-border/60 h-px flex-1" />
          <span className="text-muted-foreground/50 text-[10px] font-medium tracking-[0.25em] uppercase">
            Menu
          </span>
          <div className="bg-border/60 h-px flex-1" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <SidebarNavMenu type={navigationType} onNavigate={onNavigate} />
      </div>

      <div className="border-border/40 border-t px-6 py-5 group-data-[collapsible=icon]:hidden">
        <p className="text-muted-foreground/40 text-center text-[10px] tracking-[0.15em] uppercase">
          매듭을 맺다 &amp; 웨딩 이커머스
        </p>
      </div>
    </div>
  );
};

const AppSidebar = ({ navigationType }: AppSidebarProps) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="border-border/50 fixed top-0 left-0 z-50 h-screen border-r p-0"
    >
      <SidebarPanel
        navigationType={navigationType}
        onClose={toggleSidebar}
        onNavigate={toggleSidebar}
      />
    </Sidebar>
  );
};

export { AppSidebar, SidebarPanel };
