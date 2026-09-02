"use client";

import useSWR from "swr";
import { fetcher } from "@/ui/fetcher";
import type { SubwayStationLineInfoResponse } from "@/core/schemas/response/subway.schema";

export function useSubwayLineInfo(station?: string) {
  const swrKey = station ? `/api/subway/${encodeURIComponent(station)}` : null;

  const { data, error, isLoading } = useSWR(
    swrKey,
    (url: string) => fetcher<SubwayStationLineInfoResponse>(url),
    { shouldRetryOnError: false },
  );

  return {
    lineInfo: data,
    isLoading,
    isError: error,
  };
}
