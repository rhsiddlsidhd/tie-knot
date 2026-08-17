"use client";

import useSWR from "swr";
import { fetcher } from "@/client/fetcher";
import type { SubwayStationLineInfoResponse } from "@/core/schemas";

export function useSubwayLineInfo(station?: string) {
  const swrKey = station ? `/api/subway/${encodeURIComponent(station)}` : null;

  const { data, error, isLoading } = useSWR(swrKey, (url: string) =>
    fetcher<SubwayStationLineInfoResponse>(url),
  );

  return {
    lineInfo: data,
    isLoading,
    isError: error,
  };
}
