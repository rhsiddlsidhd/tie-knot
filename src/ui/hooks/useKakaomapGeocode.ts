"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/ui/fetcher";
import type { GeoState } from "@/adapters/browser/deeplink/open-app";
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
