import { ROUTES } from "@/core/domain/routes";
import { DemoGuestbookSection } from "./DemoGuestbookSection";
import { LiveGuestbookSection } from "../_containers/LiveGuestbookSection";

const GuestbookSection = ({ publicKey }: { publicKey: string }) => {
  if (publicKey === ROUTES.preview.samplePublicKey) {
    return <DemoGuestbookSection />;
  }
  return <LiveGuestbookSection publicKey={publicKey} />;
};

export { GuestbookSection };
