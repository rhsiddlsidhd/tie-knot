export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { ROUTES } from "@/core/domain/routes";
import { verifySession } from "@/services/auth";
import { PaymentSuccessTemplate } from "@/app/(checkout)/payment/success/_components/PaymentSuccessTemplate";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  await verifySession();
  const { orderId } = await searchParams;
  if (!orderId) return redirect(ROUTES.home);

  return <PaymentSuccessTemplate orderId={orderId} />;
}
