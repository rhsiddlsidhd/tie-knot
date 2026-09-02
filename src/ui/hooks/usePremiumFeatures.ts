"use client";

import useSWR from "swr";
import { fetcher } from "@/ui/fetcher";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { useEffect } from "react";
import { toast } from "sonner";

const usePremiumFeature = () => {
  const { data, error, isLoading } = useSWR<{ features: PremiumFeature[] }>(
    "/api/premium-features",
    fetcher,
  );

  useEffect(() => {
    if (!error) return;
    toast.error(error.message);
  }, [error]);

  return { premiumFeatures: data?.features ?? [], loading: isLoading };
};

export { usePremiumFeature };
