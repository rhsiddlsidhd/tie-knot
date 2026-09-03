"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/ui/components/atoms/button";
import { Input } from "@/ui/components/atoms/input";
import { Label } from "@/ui/components/atoms/label";
import { Switch } from "@/ui/components/atoms/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/atoms/tabs";
import { TypographyH1, TypographyMuted } from "@/ui/components/atoms/typography";

const notifyPreparing = () =>
  toast.message("설정 저장 기능은 준비 중입니다 — 실제로 저장되지 않습니다.");

const AdminSettingsTemplate = () => {
  const [allowSignup, setAllowSignup] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="space-y-6">
      <TypographyMuted>
        mock UI만 구현 — 실제 사이트 설정 저장 기능은 아직 없습니다.
      </TypographyMuted>

      <TypographyH1 className="text-left text-3xl font-bold">설정</TypographyH1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">일반</TabsTrigger>
          <TabsTrigger value="notifications">알림</TabsTrigger>
          <TabsTrigger value="payment">결제</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="max-w-md space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="site-name">사이트명</Label>
            <Input id="site-name" defaultValue="tie-knot" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-email">고객센터 이메일</Label>
            <Input id="support-email" defaultValue="support@tie-knot.com" />
          </div>

          <div className="border-border border-t pt-4" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">신규 가입 허용</p>
              <TypographyMuted className="mt-0.5">
                신규 사용자의 회원가입을 허용합니다
              </TypographyMuted>
            </div>
            <Switch checked={allowSignup} onCheckedChange={setAllowSignup} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">유지보수 모드</p>
              <TypographyMuted className="mt-0.5">
                활성화 시 공개 화면 접속이 차단됩니다
              </TypographyMuted>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>

          <Button onClick={notifyPreparing}>저장하기</Button>
        </TabsContent>

        <TabsContent value="notifications" className="pt-2">
          <TypographyMuted>알림 설정은 준비 중입니다.</TypographyMuted>
        </TabsContent>

        <TabsContent value="payment" className="pt-2">
          <TypographyMuted>결제 설정은 준비 중입니다.</TypographyMuted>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { AdminSettingsTemplate };
