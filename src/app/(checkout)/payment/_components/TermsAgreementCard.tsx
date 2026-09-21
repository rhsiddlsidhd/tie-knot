"use client";

import { Card, CardContent } from "@/ui/components/atoms/card";
import { Checkbox } from "@/ui/components/atoms/checkbox";
import { Field, FieldLabel } from "@/ui/components/atoms/field";

interface TermsAgreementCardProps {
  agreed: boolean;
  onAgreedChange: (value: boolean) => void;
}

const TermsAgreementCard = ({
  agreed,
  onAgreedChange,
}: TermsAgreementCardProps) => {
  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <Field orientation="horizontal" className="items-start">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => onAgreedChange(checked as boolean)}
          />
          <FieldLabel
            htmlFor="terms"
            className="cursor-pointer text-sm leading-relaxed font-normal"
          >
            구매조건 확인 및 결제 진행에 동의합니다.
            <br />
            <span className="text-muted-foreground">
              (전자상거래법 제 8조 2항) 주문 내용을 확인하였으며, 구매에
              동의하시겠습니까?
            </span>
          </FieldLabel>
        </Field>
      </CardContent>
    </Card>
  );
};

export { TermsAgreementCard };
