import { Button } from "@/ui/components/atoms/button";
import {
  TypographyH1,
  TypographyMuted,
} from "@/ui/components/atoms/typography";

import { InputField } from "@/ui/components/organisms/InputField";
import Link from "next/link";
import { getFieldError } from "@/core/utils/error";
import type { ApiResponse } from "@/core/domain/error";
import { ROUTES } from "@/core/domain/routes";

interface UpdatePasswordFormProps {
  action: (formData: FormData) => void;
  pending: boolean;
  state: ApiResponse<{ message: string }> | null;
  token: string;
}

const UpdatePasswordForm = ({
  action,
  pending,
  state,
  token,
}: UpdatePasswordFormProps) => {
  const passwordError = getFieldError(state, "password");
  const confirmPasswordError = getFieldError(state, "confirmPassword");

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <TypographyH1 className="text-left text-3xl font-[var(--font-NotoSerif)] font-bold">
          비밀번호 변경
        </TypographyH1>
        <TypographyMuted>변경할 비밀번호를 입력해주세요.</TypographyMuted>
      </div>

      <form action={action} className="space-y-4">
        <input name="token" defaultValue={token} hidden />

        <InputField
          id="password"
          name="password"
          label="비밀번호"
          type="password"
          placeholder="••••••••"
          required
          error={passwordError}
        />

        <InputField
          id="confirmPassword"
          name="confirmPassword"
          label="비밀번호 확인"
          type="password"
          placeholder="••••••••"
          required
          error={confirmPasswordError}
        />

        <Button type="submit" className="w-full" size="lg">
          비밀번호 변경 {pending ? "중" : "완료"}
        </Button>
      </form>

      <div className="space-y-2 text-center">
        <Link
          href={ROUTES.login}
          className="text-muted-foreground hover:text-foreground inline-block text-sm transition-colors"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
};

export { UpdatePasswordForm };
