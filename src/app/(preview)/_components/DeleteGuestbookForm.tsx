import { InputField } from "@/ui/components/organisms/InputField";
import { Button } from "@/ui/components/atoms/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/atoms/dialog";

import type { ApiResponse } from "@/core/domain/error";
import { getFieldError } from "@/core/utils/error";

interface DeleteGuestbookFormProps {
  guestbookId: string;
  publicKey: string;
  action: (formData: FormData) => void;
  pending: boolean;
  state: ApiResponse<{ message: string }> | null;
}

const DeleteGuestbookForm = ({
  guestbookId,
  publicKey,
  action,
  pending,
  state,
}: DeleteGuestbookFormProps) => {
  const passwordError = getFieldError(state, "password");

  return (
    <form action={action} className="space-y-4">
      <DialogHeader>
        <input name="guestbookId" defaultValue={guestbookId} hidden />
        <input name="publicKey" defaultValue={publicKey} hidden />
        <DialogTitle>비밀번호 확인</DialogTitle>

        <DialogDescription>
          계속 진행하려면 비밀번호를 입력해주세요.
        </DialogDescription>
      </DialogHeader>

      <InputField
        id="password"
        name="password"
        label="비밀번호"
        type="password"
        error={passwordError}
      />

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            취소
          </Button>
        </DialogClose>
        <Button type="submit">{pending ? "삭제 중..." : "전송"}</Button>
      </DialogFooter>
    </form>
  );
};

export { DeleteGuestbookForm };
