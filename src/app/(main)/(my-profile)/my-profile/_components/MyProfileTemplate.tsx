"use client";

import { Button, TypographyH1, TypographyMuted } from "@/ui/components/atoms";
import { BasicInfoForm } from "./BasicInfoForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { Camera } from "lucide-react";

interface MyProfileTemplateProps {
  email: string;
  name: string;
  phone: string;
}

const MyProfileTemplate = ({ email, name, phone }: MyProfileTemplateProps) => {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <TypographyH1 className="text-left mb-2 text-3xl font-bold">프로필 관리</TypographyH1>
        <TypographyMuted>
          회원 정보를 수정하고 관리합니다.
        </TypographyMuted>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-muted flex h-18 w-18 shrink-0 items-center justify-center rounded-full">
          <Camera className="text-muted-foreground h-6 w-6" />
        </div>
        {/* User 모델에 프로필 이미지 필드가 아직 없다 — 저장할 곳이 없으므로 준비중 안내만. */}
        <Button
          type="button"
          variant="outline"
          onClick={() => alert("프로필 사진 변경 기능은 준비 중입니다")}
        >
          사진 변경
        </Button>
      </div>

      <BasicInfoForm email={email} name={name} phone={phone} />
      <ChangePasswordForm />
    </div>
  );
};

export { MyProfileTemplate };
