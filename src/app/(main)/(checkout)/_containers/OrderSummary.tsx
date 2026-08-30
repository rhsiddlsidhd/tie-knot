"use client";

import { OrderSummary as OrderSummaryView } from "../_components";
import { useCheckoutData } from "@/ui/hooks";

const OrderSummary = () => {
  const { data, loading } = useCheckoutData();

  return <OrderSummaryView data={data} loading={loading} />;
};

export { OrderSummary };
