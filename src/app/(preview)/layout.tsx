import { GuestbookModal } from "./_components";
import { GuestbookDemoProvider, INITIAL_GUESTBOOK_DEMO_STATE } from "@/ui/context/guestbookDemo";
import React from "react";

const PreviewLayout = ({ children }: { children: React.ReactNode }) => {
  // theme, 공통 Style 정의

  return (
    <div className="min-h-screen bg-[var(--preview-background)]">
      <div className="bg-background border-muted-foreground-foreground mx-auto min-h-screen max-w-lg">
        <GuestbookDemoProvider initialValue={INITIAL_GUESTBOOK_DEMO_STATE}>
          {children}
          <GuestbookModal />
        </GuestbookDemoProvider>
      </div>
    </div>
  );
};

export default PreviewLayout;
