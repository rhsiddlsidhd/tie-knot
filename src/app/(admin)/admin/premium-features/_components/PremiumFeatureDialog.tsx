import { Button } from "@/ui/components/atoms/button";
import { DialogFooter } from "@/ui/components/atoms/dialog";
import { TypographyMuted } from "@/ui/components/atoms/typography";
import { Textarea } from "@/ui/components/atoms/textarea";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/ui/components/atoms/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/ui/components/atoms/input-group";

import type { PremiumFeature } from "@/core/domain/premium-feature";
import { TextField } from "@/ui/components/organisms/TextField";
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
        <TextField
          id="code"
          name="code"
          type="text"
          placeholder="예: ANIMATION"
          defaultValue={feature.code}
          required
          error={codeError}
        >
          기능 코드 *
        </TextField>
        <TypographyMuted>
          영문 대문자와 언더스코어만 사용 가능합니다.
        </TypographyMuted>

        <TextField
          id="label"
          name="label"
          type="text"
          placeholder="예: 애니메이션 효과"
          defaultValue={feature.label}
          required
          error={labelError}
        >
          기능 이름 *
        </TextField>

        <Field data-invalid={!!descriptionError}>
          <FieldLabel htmlFor="description">기능 설명 *</FieldLabel>
          <Textarea
            id="description"
            name="description"
            placeholder="기능에 대한 자세한 설명을 입력하세요."
            rows={3}
            defaultValue={feature.description}
            required
            aria-invalid={!!descriptionError}
          />
          <FieldError>{descriptionError}</FieldError>
        </Field>

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
