import { Button } from "@/ui/components/atoms/button";
import { Input } from "@/ui/components/atoms/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/ui/components/atoms/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/ui/components/atoms/input-group";

import { getFieldError } from "@/core/utils/error";
import type { ApiResponse } from "@/core/domain/error";
import { TextareaField } from "@/ui/components/organisms/TextareaField";

interface PremiumFeatureRegistrationFormProps {
  action: (formData: FormData) => void;
  pending: boolean;
  state: ApiResponse<{ message: string }> | null;
}

const PremiumFeatureRegistrationForm = ({
  action,
  pending,
  state,
}: PremiumFeatureRegistrationFormProps) => {
  const codeError = getFieldError(state, "code");
  const labelError = getFieldError(state, "label");
  const descriptionError = getFieldError(state, "description");
  const additionalPriceError = getFieldError(state, "additionalPrice");

  return (
    <form action={action}>
      <FieldGroup>
        <Field data-invalid={!!codeError}>
          <FieldLabel htmlFor="code">기능 코드 *</FieldLabel>
          <Input
            id="code"
            name="code"
            placeholder="예: ANIMATION, MUSIC, MAP"
            required
            aria-invalid={!!codeError}
          />
          <FieldError>{codeError}</FieldError>
          <FieldDescription>
            영문 대문자와 언더스코어만 사용 가능합니다. (예: PREMIUM_ANIMATION)
          </FieldDescription>
        </Field>

        <Field data-invalid={!!labelError}>
          <FieldLabel htmlFor="label">기능 이름 *</FieldLabel>
          <Input
            id="label"
            name="label"
            placeholder="예: 애니메이션 효과"
            required
            aria-invalid={!!labelError}
          />
          <FieldError>{labelError}</FieldError>
          <FieldDescription>
            고객에게 표시될 기능의 이름입니다.
          </FieldDescription>
        </Field>

        <div className="space-y-2">
          <TextareaField
            id="description"
            name="description"
            label="기능 설명 *"
            placeholder="기능에 대한 자세한 설명을 입력하세요."
            rows={5}
            required
            className="resize-none"
            error={descriptionError}
          />
          <FieldDescription>
            기능의 특징과 장점을 상세하게 작성해주세요. (최소 20자 이상)
          </FieldDescription>
        </div>

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
              required
              aria-invalid={!!additionalPriceError}
            />
            <InputGroupAddon align="inline-end">원</InputGroupAddon>
          </InputGroup>
          <FieldError>{additionalPriceError}</FieldError>
          <FieldDescription>
            이 기능을 추가할 때 부과되는 추가 비용입니다.
          </FieldDescription>
        </Field>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit">등록{`${!pending ? "하기" : "중"}`}</Button>
        </div>
      </FieldGroup>
    </form>
  );
};

export { PremiumFeatureRegistrationForm };
