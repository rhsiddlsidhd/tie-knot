"use client";

import { useKakaoLoader } from "@/adapters/browser/kakao/useKakaoLoader";
import { useKakaomapGeocode } from "@/ui/hooks/useKakaomapGeocode";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

const KakaoMap = ({ address }: { address: string }) => {
  useKakaoLoader();

  const geoState = useKakaomapGeocode(address);

  return (
    <div className="flex justify-center">
      {geoState.lat === null || geoState.lng === null ? (
        <motion.div
          className="bg-muted relative aspect-video w-full overflow-hidden rounded-xl"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, ease: [0.4, 0, 0.6, 1], repeat: Infinity }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="text-muted-foreground/30 h-12 w-12" />
          </div>
        </motion.div>
      ) : (
        <Map
          id="map"
          center={{
            lat: geoState.lat,
            lng: geoState.lng,
          }}
          style={{ width: "100%", height: "300px" }}
          level={5}
        >
          <MapMarker position={{ lat: geoState.lat, lng: geoState.lng }} />
        </Map>
      )}
    </div>
  );
};

export { KakaoMap };
