"use client";
import { Button } from "@/ui/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/atoms/card";
import { TypographyMuted } from "@/ui/components/atoms/typography";

import { InputField } from "@/ui/components/organisms/InputField";
import clsx from "clsx";

import { Save } from "lucide-react";
import React, { useState } from "react";

const BasicInfoForm = ({
  email,
  name,
  phone,
}: {
  email: string;
  name: string;
  phone: string;
}) => {
  const [basicInfoToggle, setBasicInfoToggle] = useState<boolean>(false);
  return (
    <form className="space-y-6">
      {/* 기본 정보 섹션 */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>
              이메일, 이름, 전화번호를 관리합니다
            </CardDescription>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              className={clsx(
                `${basicInfoToggle ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"}`,
              )}
            >
              <Save className="mr-2 h-4 w-4" />
              저장하기
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setBasicInfoToggle(!basicInfoToggle)}
            >
              {basicInfoToggle ? "닫기" : "변경하기"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <InputField
              id="email"
              name="email"
              label="이메일"
              type="email"
              defaultValue={email}
              readOnly
              className="bg-muted"
            />

            <TypographyMuted className="pt-2">
              이메일은 변경할 수 없습니다
            </TypographyMuted>
          </div>

          <InputField
            id="name"
            name="name"
            label="이름"
            type="text"
            defaultValue={name}
            readOnly={!basicInfoToggle}
            className={!basicInfoToggle ? "bg-muted" : ""}
          />

          <InputField
            id="phone"
            name="phone"
            label="전화번호"
            type="tel"
            defaultValue={phone}
            readOnly={!basicInfoToggle}
            className={!basicInfoToggle ? "bg-muted" : ""}
          />

          {basicInfoToggle && (
            <InputField
              id="password"
              name="password"
              label="비밀번호"
              type="password"
            />
          )}
        </CardContent>
      </Card>
    </form>
  );
};

export { BasicInfoForm };
