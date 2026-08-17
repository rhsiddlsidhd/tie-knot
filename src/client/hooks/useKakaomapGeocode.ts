"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/client/fetcher";
import type { GeoState } from "@/client/utils";
import type { KakaomapResponse } from "@/core/schemas";

export function useKakaomapGeocode(address: string): GeoState {
  const swrKey = address ? `/api/kakaomap?address=${address}` : null;
  const { data, error } = useSWR(swrKey, (url: string) =>
    fetcher<KakaomapResponse>(url),
  );

  useEffect(() => {
    if (!error) return;
    console.error(error.message);
  }, [error]);

  const document = data?.documents?.[0];

  return document
    ? { lat: Number(document.y), lng: Number(document.x) }
    : { lat: null, lng: null };
}
