"use client";

import { DialogDescription, DialogHeader, DialogTitle, TypographyMuted } from "@/ui/components/atoms";
import React from "react";

import { PersonValueCard } from "@/ui/components/molecules";
import { useCopy } from "@/ui/hooks";


// Contact 타입을 컴포넌트 내에서 직접 정의하여 의존성 제거
interface Contact {
  relation: string;
  name: string;
  phone: string;
}

const ContactCard = ({ contact }: { contact: Contact }) => {
  const { isCopied, copyToClipboard } = useCopy();

  return (
    <PersonValueCard
      relation={contact.relation}
      name={contact.name}
      value={contact.phone}
      isCopied={isCopied}
      onCopy={() => copyToClipboard(contact.phone)}
      ariaLabel={`${contact.relation} ${contact.name}의 연락처`}
    />
  );
};

const ViewContact = ({ payload }: { payload: Contact[] }) => {
  if (!payload || payload.length === 0) {
    return (
      <div className="p-6 text-center">
        <DialogHeader>
          <DialogTitle>연락처</DialogTitle>
        </DialogHeader>
        <div className="mt-8 space-y-2">
          <TypographyMuted>혼인 당사자의 요청으로 인해</TypographyMuted>
          <TypographyMuted>연락처가 비공개 되었습니다.</TypographyMuted>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DialogHeader className="p-0">
        <DialogTitle className="text-xl">연락처</DialogTitle>
        <DialogDescription>
          아래 연락처를 통해 축하의 마음을 전해보세요.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-2 space-y-3 p-0">
        {payload.map((contact) => (
          <ContactCard key={contact.relation} contact={contact} />
        ))}
      </div>
    </div>
  );
};

export { ViewContact };
