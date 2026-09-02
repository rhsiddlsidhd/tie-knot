"use client";

import { Input } from "@/ui/components/atoms/input";
import { FormField } from "@/ui/components/organisms/FormField";
import { TextField } from "@/ui/components/organisms/TextField";
import { useDaumPopup } from "@/adapters/browser/daum/useDaumPopup";
import { useState } from "react";

interface AddressFieldProps {
  name: string;
  label?: string;
  error?: string;
  addressDetailError?: string;
  required?: boolean;
  defaultValue?: string;
  addressDetailDefaultValue?: string;
}

/**
 * 도메인 특화 로직(Daum API)이 결합된 주소 입력 필드 (Organism)
 */
const AddressField = ({
  name,
  label = "주소",
  error,
  addressDetailError,
  required = false,
  defaultValue = "",
  addressDetailDefaultValue = "",
}: AddressFieldProps) => {
  const { handleDaumAddressPopup, address } = useDaumPopup();
  const [weddingAddress, setWeddingAddress] = useState(defaultValue);
  const [prevAddress, setPrevAddress] = useState(address);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);

  if (address !== prevAddress) {
    setPrevAddress(address);
    if (address) {
      setWeddingAddress(address);
    }
  }

  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    setWeddingAddress(defaultValue);
  }

  const fieldId = `${name}_address`;

  return (
    <FormField id={fieldId} label={label} error={error} required={required}>
      <Input
        id={fieldId}
        name={fieldId}
        value={weddingAddress}
        placeholder={`${label}를 검색하세요`}
        required={required}
        readOnly
        onClick={handleDaumAddressPopup}
        aria-invalid={!!error}
      />

      <TextField
        id={`${name}AddressDetail`}
        name={`${name}_address_detail`}
        type="text"
        placeholder="예: 3층 그랜드볼룸"
        required={required}
        defaultValue={addressDetailDefaultValue}
        error={addressDetailError}
      >
        상세 주소
      </TextField>
    </FormField>
  );
};

export { AddressField };
