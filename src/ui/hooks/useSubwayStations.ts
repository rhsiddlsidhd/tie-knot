"use client";

import useSWR from "swr";
import { fetcher } from "@/ui/fetcher";
import type { SubwayStationsResponse } from "@/core/schemas";

export function useSubwayStations() {
  const { data, error, isLoading } = useSWR<SubwayStationsResponse>(
    "/api/subway",
    fetcher,
    { shouldRetryOnError: false },
  );

  return {
    subwayStations: data,
    isLoading,
    isError: error,
  };
}
