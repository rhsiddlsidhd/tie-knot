"use client";

import { useEffect, useState } from "react";
import type { NullableCoordinates } from "@/core/domain/geo";
import { getCurrentCoordinates } from "@/adapters/browser/geolocation/current-position";
import { useKakaomapGeocode } from "./useKakaomapGeocode";

export interface NavigationGeo {
  current: NullableCoordinates;
  target: NullableCoordinates;
}

export function useNavigationGeo(address: string): NavigationGeo {
  const [current, setCurrent] = useState<NullableCoordinates>({
    lng: null,
    lat: null,
  });

  useEffect(() => {
    const fetchCurrentCoordinates = async () => {
      const coordinate = await getCurrentCoordinates();
      if (coordinate) {
        setCurrent(coordinate);
      }
    };

    fetchCurrentCoordinates();
  }, []);

  const target = useKakaomapGeocode(address);

  return { current, target };
}
