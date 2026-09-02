import { PaymentResult } from "@/app/(main)/payment-result/_containers/PaymentResult";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { paymentId } = await searchParams;

  return <PaymentResult paymentId={paymentId} />;
}
