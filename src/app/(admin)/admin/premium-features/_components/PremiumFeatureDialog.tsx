import { Button } from "@/ui/components/atoms/button";
import { DialogFooter } from "@/ui/components/atoms/dialog";
import { TypographyMuted } from "@/ui/components/atoms/typography";
import { Field, FieldLabel, FieldError } from "@/ui/components/atoms/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/ui/components/atoms/input-group";

import type { PremiumFeature } from "@/core/domain/premium-feature";
import { InputField } from "@/ui/components/organisms/InputField";
import { SwitchField } from "@/ui/components/organisms/SwitchField";
import { TextareaField } from "@/ui/components/organisms/TextareaField";
import type { ApiResponse } from "@/core/domain/error";
import { getFieldError } from "@/core/utils/error";

interface PremiumFeatureDialogProps {
  premiumFeature: PremiumFeature;
  action: (formData: FormData) => void;
  pending: boolean;
  state: ApiResponse<{ message: string }> | null;
}

const PremiumFeatureDialog = ({
  premiumFeature: feature,
  action,
  pending,
  state,
}: PremiumFeatureDialogProps) => {
  const codeError = getFieldError(state, "code");
  const labelError = getFieldError(state, "label");
  const descriptionError = getFieldError(state, "description");
  const additionalPriceError = getFieldError(state, "additionalPrice");

  return (
    <form action={action}>
      <div className="space-y-4 py-4">
        {/* 기능 코드는 수정할 수 없다 — 코드는 청첩장 렌더 분기의 키이고, 바꾸면
            같은 문서가 판매 시점에 따라 다른 동작을 갖게 된다(이미 팔린 주문은
            스냅샷으로 옛 코드를 유지한다). 다른 기능이 필요하면 새로 등록한다. */}
        <Field data-invalid={!!codeError}>
          <FieldLabel>기능 코드</FieldLabel>
          <p className="font-mono text-sm">{feature.code}</p>
          <input type="hidden" name="code" value={feature.code} />
          <FieldError>{codeError}</FieldError>
          <TypographyMuted>
            기능 코드는 등록 후 변경할 수 없습니다.
          </TypographyMuted>
        </Field>

        <InputField
          id="label"
          name="label"
          label="기능 이름 *"
          type="text"
          placeholder="예: 애니메이션 효과"
          defaultValue={feature.label}
          required
          error={labelError}
        />

        <TextareaField
          id="description"
          name="description"
          label="기능 설명 *"
          placeholder="기능에 대한 자세한 설명을 입력하세요."
          rows={3}
          defaultValue={feature.description}
          required
          error={descriptionError}
        />

        <Field data-invalid={!!additionalPriceError}>
          <FieldLabel htmlFor="additionalPrice">추가 비용 *</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="additionalPrice"
              name="additionalPrice"
              type="number"
              placeholder="0"
              min={0}
              step={1000}
              defaultValue={feature.additionalPrice}
              required
              aria-invalid={!!additionalPriceError}
            />
            <InputGroupAddon align="inline-end">원</InputGroupAddon>
          </InputGroup>
          <FieldError>{additionalPriceError}</FieldError>
        </Field>

        <input
          type="hidden"
          id="featureId"
          name="featureId"
          value={feature._id}
        />

        <SwitchField
          id="isActive"
          name="isActive"
          label="등록 가능"
          description="끄면 새 상품에 이 기능을 붙일 수 없습니다. 이미 이 기능을 쓰는 상품은 그대로 판매됩니다."
          defaultChecked={feature.isActive}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline">
          취소
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "수정 중..." : "수정"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export { PremiumFeatureDialog };
