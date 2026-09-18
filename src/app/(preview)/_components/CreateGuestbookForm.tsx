import { Button } from "@/ui/components/atoms/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/atoms/dialog";

import { SwitchField } from "@/ui/components/organisms/SwitchField";
import { InputField } from "@/ui/components/organisms/InputField";
import { TextareaField } from "@/ui/components/organisms/TextareaField";

import type { ApiResponse } from "@/core/domain/error";
import { getFieldError } from "@/core/utils/error";

interface CreateGuestbookFormProps {
  publicKey: string;
  action: (formData: FormData) => void;
  pending: boolean;
  state: ApiResponse<{ message: string }> | null;
}

const CreateGuestbookForm = ({
  publicKey,
  action,
  pending,
  state,
}: CreateGuestbookFormProps) => {
  const authorError = getFieldError(state, "author");
  const passwordError = getFieldError(state, "password");

  return (
    <form action={action} className="space-y-4">
      <DialogHeader>
        <DialogTitle>방명록 작성</DialogTitle>
        <DialogDescription>소중한 축하 메시지를 남겨주세요.</DialogDescription>
      </DialogHeader>

      <input type="hidden" name="publicKey" value={publicKey} />

      <InputField
        name="author"
        placeholder="이름을 입력하세요."
        id="author"
        label="이름"
        type="text"
        required
        error={authorError}
      />

      <InputField
        type="password"
        name="password"
        id="password"
        label="비밀번호"
        placeholder="비밀번호를 입력하세요."
        error={passwordError}
      />

      <TextareaField
        id="message"
        name="message"
        label="메시지"
        placeholder="메시지를 입력하세요."
        rows={5}
        required
      />

      <SwitchField id="isPrivate" name="isPrivate" label="비밀글" />

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            취소
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "전송 중..." : "축하 글 전달하기"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export { CreateGuestbookForm };
