"use client";

import useSWR from "swr";
import { fetcher } from "@/ui/fetcher";
import type { SubwayStationsResponse } from "@/core/schemas/response/subway.schema";

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
