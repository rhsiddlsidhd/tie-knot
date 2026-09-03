"use client";

import { Badge } from "@/ui/components/atoms/badge";
import { ClipboardButton } from "@/ui/components/organisms/ClipboardButton";
import { useCopy } from "@/ui/hooks/useCopy";
import { useNavigationGeo } from "@/ui/hooks/useNavigationGeo";
import { useSubwayLineInfo } from "@/ui/hooks/useSubwayLineInfo";
import { EyebrowSection } from "./EyebrowSection";
import { KakaoMap } from "./KakaoMap";

import { Navigation } from "./Navigation";
import type { LocationSectionProps } from "../_utils/locationSection.mapper";

export function LocationSection({
  venueName,
  address,
  addressDetail,
  subwayStation,
}: LocationSectionProps) {
  const fullAddress = addressDetail ? `${address} ${addressDetail}` : address;
  const { isCopied, copyToClipboard } = useCopy();
  const geoState = useNavigationGeo(fullAddress);
  const { lineInfo } = useSubwayLineInfo(subwayStation);

  return (
    <EyebrowSection eyebrow="LOCATION" heading="오시는 길">
      <div>
        <p className="text-foreground text-md font-semibold sm:text-lg">{venueName}</p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-muted-foreground text-sm sm:text-base">{fullAddress}</p>
          {/* 재사용 가능한 ClipboardButton으로 교체 */}
          <ClipboardButton
            isCopied={isCopied}
            onCopy={() => copyToClipboard(fullAddress)}
          />
        </div>
      </div>

      {/* Map placeholder */}
      <div className="bg-muted relative mb-6 aspect-video overflow-hidden rounded-xl">
        <KakaoMap address={address} />
      </div>

      {/* Navigation Buttons */}
      <Navigation address={fullAddress} geoState={geoState} />

      {/* Transportation Info */}
      {lineInfo && (
        <div className="space-y-2 text-left">
          <p className="text-sm font-bold sm:text-base">지하철</p>
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span className="text-muted-foreground">{lineInfo.station}역</span>
            <div className="flex gap-1.5">
              {lineInfo.lines.map((line) => (
                <Badge
                  key={line.name}
                  className="text-white"
                  style={{ backgroundColor: line.color }}
                >
                  {line.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </EyebrowSection>
  );
}
