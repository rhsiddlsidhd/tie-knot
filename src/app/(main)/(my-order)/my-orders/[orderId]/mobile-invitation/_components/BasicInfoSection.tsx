import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/atoms/card";
import { format } from "date-fns";
import { ComboboxField } from "./ComboboxField";
import { DateField } from "./DateField";
import { AddressField } from "@/ui/components/organisms/AddressField";
import { SwitchField } from "@/ui/components/organisms/SwitchField";
import { InputField } from "@/ui/components/organisms/InputField";

import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
import type { SubwayStationsResponse } from "@/core/schemas/response/subway.schema";

type BasicInfoSectionProps = {
  data?: Pick<
    MobileInvitationContent,
    | "weddingDate"
    | "venue"
    | "address"
    | "addressDetail"
    | "subwayStation"
    | "guestbookEnabled"
  >;
  subwayStations?: SubwayStationsResponse;
};

const BasicInfoSection = ({ data, subwayStations }: BasicInfoSectionProps) => {
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

          <InputField
            id="weddingTime"
            name="wedding_time"
            label="결혼식 시간"
            type="time"
            placeholder="결혼식 시간"
            defaultValue={
              data?.weddingDate
                ? format(new Date(data.weddingDate), "HH:mm")
                : ""
            }
            required
          />
        </div>

        {/* 예식장명 */}
        <InputField
          id="venueName"
          name="venue_name"
          label="예식장명"
          type="text"
          placeholder="예: 더 컨벤션 웨딩홀"
          defaultValue={data?.venue}
          required
        />

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
          label="방명록 사용"
          description="하객들이 축하 메시지를 남길 수 있습니다."
          defaultChecked={data?.guestbookEnabled}
        />
      </CardContent>
    </Card>
  );
};

export { BasicInfoSection };
