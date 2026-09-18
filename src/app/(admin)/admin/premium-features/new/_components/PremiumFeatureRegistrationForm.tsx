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
import { IMPLEMENTED_PREMIUM_FEATURE_CODES } from "@/core/domain/premium-feature";
import { BaseSelect } from "@/ui/components/molecules/BaseSelect";
import { SwitchField } from "@/ui/components/organisms/SwitchField";
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
          {/* 청첩장이 렌더 분기를 구현한 코드만 고를 수 있다 — 자유 입력이면
              템플릿이 모르는 코드가 등록돼 팔리기만 하고 동작하지 않는다. */}
          <BaseSelect
            id="code"
            name="code"
            placeholder="기능 코드를 선택하세요"
            options={IMPLEMENTED_PREMIUM_FEATURE_CODES.map((code) => ({
              value: code,
              label: code,
            }))}
            required
            aria-invalid={!!codeError}
          />
          <FieldError>{codeError}</FieldError>
          <FieldDescription>
            청첩장에 실제로 적용되는 기능만 목록에 표시됩니다.
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

        <SwitchField
          id="isActive"
          name="isActive"
          label="등록 가능"
          description="끄면 새 상품에 이 기능을 붙일 수 없습니다. 이미 이 기능을 쓰는 상품은 그대로 판매됩니다."
          defaultChecked
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit">등록{`${!pending ? "하기" : "중"}`}</Button>
        </div>
      </FieldGroup>
    </form>
  );
};

export { PremiumFeatureRegistrationForm };
