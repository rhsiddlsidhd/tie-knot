"use client";

import useSWR from "swr";
import { fetcher } from "@/ui/fetcher";
import type { BanksResponse } from "@/core/schemas/response/banks.schema";

function useBanks() {
  const { data, error, isLoading } = useSWR<BanksResponse>("/api/banks", fetcher);

  return {
    banks: data,
    isLoading,
    isError: error,
  };
}

export { useBanks };
