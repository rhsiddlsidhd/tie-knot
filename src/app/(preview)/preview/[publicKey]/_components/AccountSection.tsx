"use client";

import { EyebrowSection } from "./EyebrowSection";
import React, { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TypographyMuted } from "@/ui/components/atoms";
import { PersonValueCard } from "@/ui/components/molecules";
import { useCopy } from "@/ui/hooks";

import { cn } from "@/core/utils";
import { useBanks } from "@/ui/hooks";

import type {
  AccountInfo,
  AccountSectionMappedProps,
} from "../_utils/accountSection.mapper";

interface AccountCardProps {
  account: AccountInfo;
  bankName: string;
}

const AccountCard = ({ account, bankName }: AccountCardProps) => {
  const { isCopied, copyToClipboard } = useCopy();

  return (
    <PersonValueCard
      relation={account.relation}
      name={account.name}
      subLabel={bankName}
      value={account.accountNumber}
      isCopied={isCopied}
      onCopy={() => copyToClipboard(account.accountNumber)}
      ariaLabel={`${account.relation} ${account.name}의 계좌 정보`}
    />
  );
};

const AccountSection = ({
  groomAccounts,
  brideAccounts,
}: AccountSectionMappedProps) => {
  const [selectedSide, setSelectedSide] = useState<"groom" | "bride">("groom");
  const { banks } = useBanks();

  const bankNameMap = useMemo(() => {
    if (!banks) return {};
    return banks.reduce(
      (map, bank) => {
        map[bank.bank] = bank.name.ko;
        return map;
      },
      {} as Record<string, string>,
    );
  }, [banks]);

  const renderAccountCards = (accounts: AccountInfo[]) => {
    if (accounts.length === 0) {
      return (
        <TypographyMuted className="text-center">
          등록된 계좌 정보가 없습니다.
        </TypographyMuted>
      );
    }

    return accounts.map((account) => (
      <AccountCard
        key={account.relation}
        account={account}
        bankName={bankNameMap[account.bankName] || account.bankName}
      />
    ));
  };

  return (
    <EyebrowSection eyebrow="ACCOUNT" heading="마음 전하실 곳">
      {/* Toggle UI */}
      <div className="mb-6 flex justify-center">
        <Tabs
          defaultValue="groom"
          onValueChange={(value) => setSelectedSide(value as "groom" | "bride")}
          className="w-50"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groom">신랑측</TabsTrigger>
            <TabsTrigger value="bride">신부측</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Opacity-based transition container */}
      <div className="grid">
        {/* Groom's List */}
        <div
          className={cn(
            "space-y-3 transition-opacity duration-300 [grid-area:1/1]",
            selectedSide === "groom"
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          {renderAccountCards(groomAccounts)}
        </div>

        {/* Bride's List */}
        <div
          className={cn(
            "space-y-3 transition-opacity duration-300 [grid-area:1/1]",
            selectedSide === "bride"
              ? "opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          {renderAccountCards(brideAccounts)}
        </div>
      </div>
    </EyebrowSection>
  );
};

export { AccountSection };
