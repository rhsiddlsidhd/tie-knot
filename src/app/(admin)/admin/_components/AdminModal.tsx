"use client";

import { ProductEditDialog } from "@/app/(admin)/admin/products/_components";
import type { AdminModalState, ModalPropsMap } from "@/ui/stores";
import { useAdminModalStore } from "@/ui/stores";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/ui/components/atoms";
import { PremiumFeatureDialog } from "@/app/(admin)/admin/premium-features/_components";

const modalCopy: Record<
  Exclude<AdminModalState["type"], null>,
  { title: string; des: string }
> = {
  "EDIT-PRODUCT": {
    title: "상품 수정",
    des: "상품 정보를 수정합니다.",
  },
  "EDIT-PREMIUMFEATURE": {
    title: "프리미엄 기능 수정",
    des: "프리미엄 기능 정보를 수정합니다.",
  },
};

const AdminModal = () => {
  const type = useAdminModalStore((state) => state.type);
  const open = useAdminModalStore((state) => state.isOpen);
  const close = useAdminModalStore((state) => state.closeModal);
  const props = useAdminModalStore((state) => state.props);

  if (!type) return null;

  const copy = modalCopy[type];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.des}</DialogDescription>
        </DialogHeader>
        {type === "EDIT-PRODUCT" && (
          <ProductEditDialog {...(props as ModalPropsMap["EDIT-PRODUCT"])} />
        )}
        {type === "EDIT-PREMIUMFEATURE" && (
          <PremiumFeatureDialog
            {...(props as ModalPropsMap["EDIT-PREMIUMFEATURE"])}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export { AdminModal };
