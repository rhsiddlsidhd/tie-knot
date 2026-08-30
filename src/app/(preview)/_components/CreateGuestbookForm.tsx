"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createGuestbook } from "@/actions";
import type { APIResponse } from "@/core/domain";
import { routes } from "@/core/domain";
import { parseGuestbookFormData } from "@/core/schemas";
import { hasFieldErrors } from "@/core/utils";
import { useGuestbookDemo } from "@/ui/context/guestbookDemo";
import { useGuestbookModalStore } from "@/ui/stores";
import { CreateGuestbookForm as PureCreateGuestbookForm } from "@/ui/components/organisms";
interface Payload {
  publicKey: string;
}

const isPayload = (payload: unknown): payload is Payload => {
  if (!payload) return false;
  if (
    typeof payload === "object" &&
    "publicKey" in payload &&
    typeof payload.publicKey === "string"
  )
    return true;
  return false;
};

export function CreateGuestbookForm({ payload }: { payload: unknown }) {
  const publicKey = isPayload(payload) ? payload.publicKey : null;
  const isDemo = publicKey === routes.preview.samplePublicKey;

  // 아래 hook 4개는 payload 유효성과 무관하게 항상 호출된다 — 유효성 검사(throw)는
  // 맨 아래로 미뤄, 렌더마다 호출되는 hook 개수가 달라지는 걸 막는다.
  const closeModal = useGuestbookModalStore((state) => state.closeModal);
  const router = useRouter();
  const [, dispatchDemo] = useGuestbookDemo();

  // 데모 페이지에서는 실제 createGuestbook Server Action/DB를 호출하지 않는다 —
  // 실제 Action과 같은 파싱+검증(parseGuestbookFormData)을 거친 뒤 Context에만
  // 항목을 추가한다.
  const createDemoGuestbook = async (
    _prev: null,
    formData: FormData,
  ): Promise<APIResponse<{ message: string }>> => {
    const parsed = parseGuestbookFormData(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          category: "VALIDATION",
          message: "입력값을 확인해주세요",
          fieldErrors: parsed.error,
        },
      };
    }

    dispatchDemo({
      type: "ADD_ENTRY",
      payload: {
        author: parsed.data.author,
        message: parsed.data.message,
        password: parsed.data.password,
      },
    });

    return {
      success: true,
      data: { message: "방명록 작성이 완료되었습니다." },
    };
  };

  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(isDemo ? createDemoGuestbook : createGuestbook, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      toast.message(state.data.message);
      closeModal();
      if (!isDemo) return router.refresh();
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state, router, closeModal, isDemo]);

  if (!publicKey) throw new Error("CreateGuestbookForm payload is required");

  return (
    <>
      <PureCreateGuestbookForm
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
