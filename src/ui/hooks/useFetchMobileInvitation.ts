"use client";
import { fetcher } from "@/ui/fetcher";
import type { MobileInvitationEditor } from "@/core/domain/mobile-invitation";
import useSWR from "swr";

const useFetchMobileInvitation = (orderId?: string) => {
  const swrKey = orderId ? `/api/mobile-invitations/${orderId}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    (url: string) => fetcher<MobileInvitationEditor | null>(url),
    {
      // 수정 페이지에 최적화된 옵션
      revalidateOnFocus: false, // 탭 전환 시 재검증 방지
      revalidateOnReconnect: false, // 재접속 시 재검증 방지
      dedupingInterval: 10000, // 10초 내 중복 요청 방지
      shouldRetryOnError: false, // 에러 발생 시 재시도 안함 (수정 페이지는 데이터가 없으면 오류)
      keepPreviousData: true, // 이전 데이터 유지 (로딩 시 깜빡임 방지)
    },
  );

  return { data, error, isLoading, mutate };
};

export { useFetchMobileInvitation };
