import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/atoms/card";
import { TypographyH3 } from "@/ui/components/atoms/typography";

import { BankField } from "@/ui/components/organisms/BankField";
import { InputField } from "@/ui/components/organisms/InputField";

import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
import type { BanksResponse } from "@/core/schemas/response/banks.schema";

type CoupleInfoSectionProps = {
  data?: Pick<MobileInvitationContent, "groom" | "bride">;
  banks?: BanksResponse;
};

const CoupleInfoSection = ({ data, banks }: CoupleInfoSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>신랑 & 신부 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Groom Info */}
          <div className="space-y-4">
            <TypographyH3 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
              신랑 정보
            </TypographyH3>

            <InputField
              id="groom.name"
              name="groom_name"
              label="이름"
              type="text"
              placeholder="신랑 이름"
              defaultValue={data?.groom?.name}
              required
            />

            <InputField
              id="groom.phone"
              name="groom_phone"
              label="연락처"
              type="tel"
              placeholder="010-1234-5678"
              defaultValue={data?.groom?.phone}
              required
            />

            <BankField
              id="groom"
              defaultBankName={data?.groom?.bankName}
              defaultAccountNumber={data?.groom?.accountNumber}
              banks={banks}
            />
          </div>

          {/* Bride Info */}
          <div className="space-y-4">
            <TypographyH3 className="text-foreground border-border border-b pb-2 text-lg font-semibold">
              신부 정보
            </TypographyH3>

            <InputField
              id="bride.name"
              name="bride_name"
              label="이름"
              type="text"
              placeholder="신부 이름"
              defaultValue={data?.bride?.name}
              required
            />

            <InputField
              id="bride.phone"
              name="bride_phone"
              label="연락처"
              type="tel"
              placeholder="010-1234-5678"
              defaultValue={data?.bride?.phone}
              required
            />

            <BankField
              id="bride"
              defaultBankName={data?.bride?.bankName}
              defaultAccountNumber={data?.bride?.accountNumber}
              banks={banks}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { CoupleInfoSection };
