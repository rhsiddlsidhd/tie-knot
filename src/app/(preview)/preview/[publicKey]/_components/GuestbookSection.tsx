import { routes } from "@/core/domain/routes";
import { DemoGuestbookSection } from "./DemoGuestbookSection";
import { LiveGuestbookSection } from "../_containers/LiveGuestbookSection";

export function GuestbookSection({ publicKey }: { publicKey: string }) {
  if (publicKey === routes.preview.samplePublicKey) {
    return <DemoGuestbookSection />;
  }
  return <LiveGuestbookSection publicKey={publicKey} />;
}
