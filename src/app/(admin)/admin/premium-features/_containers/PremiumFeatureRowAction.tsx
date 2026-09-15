"use client";

import { Edit } from "lucide-react";

import { Button } from "@/ui/components/atoms/button";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { useAdminModalStore } from "@/ui/stores/use-app-store";

const PremiumFeatureRowAction = ({
  premiumFeature,
}: {
  premiumFeature: PremiumFeature;
}) => {
  const openModal = useAdminModalStore((state) => state.openModal);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        aria-label="기능 수정"
        onClick={() => openModal("EDIT-PREMIUMFEATURE", { premiumFeature })}
      >
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
};

export { PremiumFeatureRowAction };
