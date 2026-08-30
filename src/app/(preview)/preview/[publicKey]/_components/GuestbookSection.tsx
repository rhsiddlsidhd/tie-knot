import { routes } from "@/core/domain";
import { DemoGuestbookSection } from "./DemoGuestbookSection";
import { LiveGuestbookSection } from "./LiveGuestbookSection";

export function GuestbookSection({ publicKey }: { publicKey: string }) {
  if (publicKey === routes.preview.samplePublicKey) {
    return <DemoGuestbookSection />;
  }
  return <LiveGuestbookSection publicKey={publicKey} />;
}
