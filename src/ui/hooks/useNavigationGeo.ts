"use client";

import { useEffect, useState } from "react";
import type { GeoState } from "@/adapters/browser/deeplink/open-app";
import { getCurrentCoordinates } from "@/adapters/browser/geolocation/current-position";
import { useKakaomapGeocode } from "./useKakaomapGeocode";

export interface NavigationGeo {
  current: GeoState;
  target: GeoState;
}

export function useNavigationGeo(address: string): NavigationGeo {
  const [current, setCurrent] = useState<GeoState>({ lng: null, lat: null });

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
