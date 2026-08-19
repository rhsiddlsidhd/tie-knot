import { PaymentResult } from "./_components";

export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { paymentId } = await searchParams;

  return <PaymentResult paymentId={paymentId} />;
}
