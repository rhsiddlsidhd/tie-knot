"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/atoms";
import { format } from "date-fns";
import { ComboboxField, DateField } from "@/ui/components/molecules";
import { AddressField, SwitchField, TextField } from "@/ui/components/organisms";

import type { InvitationContent } from "@/core/domain";
import type { SubwayStationsResponse } from "@/core/schemas";

type BasicInfoSectionProps = {
  data?: Pick<InvitationContent, "weddingDate" | "venue" | "address" | "addressDetail" | "subwayStation" | "guestbookEnabled">;
  subwayStations?: SubwayStationsResponse;
};

export function BasicInfoSection({ data, subwayStations }: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Date Picker */}
          <DateField
            id="weddingDate"
            name="wedding_date"
            defaultValue={
              data?.weddingDate ? new Date(data.weddingDate) : undefined
            }
            required
          >
            결혼식 날짜
          </DateField>

          <TextField
            id="weddingTime"
            name="wedding_time"
            type="time"
            placeholder="결혼식 시간"
            defaultValue={
              data?.weddingDate
                ? format(new Date(data.weddingDate), "HH:mm")
                : ""
            }
            required
          >
            결혼식 시간
          </TextField>
        </div>

        {/* 예식장명 */}
        <TextField
          id="venueName"
          name="venue_name"
          type="text"
          placeholder="예: 더 컨벤션 웨딩홀"
          defaultValue={data?.venue}
          required
        >
          예식장명
        </TextField>

        {/* Address (+ 상세 주소는 AddressField 내부에서 함께 렌더) */}
        <AddressField
          required
          name="venue"
          defaultValue={data?.address}
          addressDetailDefaultValue={data?.addressDetail}
        />

        {/* 인근 지하철 역 */}
        <ComboboxField
          id="subwayStation"
          name="subway_station"
          placeholder="지하철역 검색"
          defaultValue={data && data.subwayStation}
          options={subwayStations ?? []}
        >
          인근 지하철 역
        </ComboboxField>

        {/* Guestbook Toggle */}
        <SwitchField
          id={"guestbookEnabled"}
          name={"guestbook_enabled"}
          message={"하객들이 축하 메시지를 남길 수 있습니다."}
          defaultValue={data?.guestbookEnabled}
        >
          방명록 사용
        </SwitchField>
      </CardContent>
    </Card>
  );
}
