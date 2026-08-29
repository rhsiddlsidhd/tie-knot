"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { deleteGuestbook } from "@/actions";
import type { APIResponse } from "@/core/domain";
import { routes } from "@/core/domain";
import { hasFieldErrors } from "@/core/utils";
import { useGuestbookDemo } from "@/ui/context/guestbookDemo";
import { useGuestbookModalStore } from "@/ui/stores";
import { DeleteGuestbookForm as PureDeleteGuestbookForm } from "@/ui/components/organisms";

interface Payload {
  id: string;
  publicKey: string;
}

const isPayload = (payload: unknown): payload is Payload => {
  if (!payload) return false;
  if (
    typeof payload === "object" &&
    "id" in payload &&
    typeof payload.id === "string" &&
    "publicKey" in payload &&
    typeof payload.publicKey === "string"
  )
    return true;
  return false;
};

export function DeleteGuestbookForm({ payload }: { payload: unknown }) {
  if (!isPayload(payload)) throw new Error("DeleteGuestbookForm payload is required");
  const { id: guestbookId, publicKey } = payload;

  const closeModal = useGuestbookModalStore((state) => state.closeModal);
  const [{ entries }, dispatchDemo] = useGuestbookDemo();

  const isDemo = publicKey === routes.preview.samplePublicKey;

  // 데모 페이지에서는 실제 deleteGuestbook Server Action/DB를 호출하지 않는다 —
  // Context가 들고 있는 해당 항목의 비밀번호를 직접 대조한 뒤 제거한다.
  const deleteDemoGuestbook = async (
    _prev: null,
    formData: FormData,
  ): Promise<APIResponse<{ message: string }>> => {
    const password = formData.get("password") as string;
    const entry = entries.find((item) => item.id === guestbookId);
    if (!entry) {
      return {
        success: false,
        error: { category: "NOT_FOUND", message: "해당 게시글을 찾을 수 없습니다." },
      };
    }
    if (entry.password !== password) {
      return {
        success: false,
        error: { category: "UNAUTHENTICATED", message: "비밀번호가 일치하지 않습니다." },
      };
    }

    dispatchDemo({ type: "REMOVE_ENTRY", payload: { id: guestbookId } });

    return {
      success: true,
      data: { message: "게시글이 성공적으로 삭제되었습니다." },
    };
  };

  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(isDemo ? deleteDemoGuestbook : deleteGuestbook, null);

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
    <>
      <PureDeleteGuestbookForm
        guestbookId={guestbookId}
        publicKey={publicKey}
        action={action}
        pending={pending}
        state={state}
      />
      {isDemo && (
        <p className="text-muted-foreground text-center text-xs">
          데모 페이지의 방명록은 저장되지 않습니다.
        </p>
      )}
    </>
  );
}
