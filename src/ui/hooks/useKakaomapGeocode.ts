"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/ui/fetcher";
import type { NullableCoordinates } from "@/core/domain/geo";
import type { KakaomapResponse } from "@/core/schemas/response/kakaomap.schema";

export function useKakaomapGeocode(address: string): NullableCoordinates {
  const trimmedAddress = address.trim();
  const swrKey = trimmedAddress
    ? `/api/kakao-map?address=${encodeURIComponent(trimmedAddress)}`
    : null;
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
