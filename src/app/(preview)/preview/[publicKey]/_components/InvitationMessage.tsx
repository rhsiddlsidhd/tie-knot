"use client";

import { Button, TypographyP, TypographyLarge, TypographyMuted, Separator } from "@/ui/components/atoms";
import { EyebrowSection } from "./EyebrowSection";


import { useGuestbookModalStore } from "@/ui/stores";
import type { InvitationMessageMappedProps } from "../_utils/invitationMessage.mapper";

const pinMessage = [
  "저희 두 사람의 소중한 첫걸음에",
  "귀한 걸음 하시어",
  "축복해 주시면 감사하겠습니다.",
];

export function InvitationMessage({ parties }: InvitationMessageMappedProps) {
  const { setIsOpen } = useGuestbookModalStore();

  return (
    <EyebrowSection eyebrow="INVITATION" heading="소중한 분들을 초대합니다.">
      <div className="mb-16 space-y-2">
        {pinMessage.map((msg) => (
          <TypographyP key={msg} className="m-0 text-lg leading-relaxed tracking-wide">
            {msg}
          </TypographyP>
        ))}
      </div>

      <div className="space-y-10">
        {parties.map((party, index) => (
          <div key={party.title} className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-6">
              {party.parents.map((parent) => (
                <div key={parent.label} className="flex items-center gap-2">
                  <TypographyMuted className="text-xs opacity-60 sm:text-sm">
                    {parent.label}
                  </TypographyMuted>
                  <TypographyMuted className="text-base sm:text-lg">{parent.name}</TypographyMuted>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <TypographyMuted className="text-xs opacity-60 sm:text-sm">{party.title}</TypographyMuted>
              <TypographyLarge className="text-xl font-bold sm:text-2xl">{party.name}</TypographyLarge>
            </div>

            <Button
              onClick={() =>
                setIsOpen({
                  isOpen: true,
                  type: "VIEW_CONTACT",
                  payload: party.contacts,
                })
              }
              variant="outline"
              size="sm"
              className="mt-6 h-9 rounded-full px-6 text-xs tracking-tight transition-all hover:bg-primary hover:text-primary-foreground"
            >
              {`${party.title}측 연락하기`}
            </Button>

            {index === 0 && <Separator className="mt-10 w-16 opacity-50" />}
          </div>
        ))}
      </div>
    </EyebrowSection>
  );
}
