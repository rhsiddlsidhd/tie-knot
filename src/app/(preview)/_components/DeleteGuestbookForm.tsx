"use client";

import { useActionState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { deleteGuestbook } from "@/actions";
import type { APIResponse } from "@/core/domain";
import { hasFieldErrors } from "@/core/utils";
import { useGuestbookModalStore } from "@/ui/stores";
import { DeleteGuestbookForm as PureDeleteGuestbookForm } from "@/ui/components/organisms";
export function DeleteGuestbookForm({ payload }: { payload: string }) {
  const { publicKey } = useParams<{ publicKey: string }>();
  const closeModal = useGuestbookModalStore((state) => state.closeModal);
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(deleteGuestbook, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      toast(state.data.message);
      closeModal();
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state, closeModal]);

  return (
    <PureDeleteGuestbookForm
      guestbookId={payload}
      publicKey={publicKey}
      action={action}
      pending={pending}
      state={state}
    />
  );
}
