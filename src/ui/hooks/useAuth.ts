"use client";

import useSWR from "swr";
import type { AuthSessionResponse } from "@/core/schemas/response/auth.schema";
import { fetcher } from "@/ui/fetcher";
export function useAuth() {
  const { data: session, isLoading } = useSWR<AuthSessionResponse>(
    "/api/auth/me",
    fetcher,
    { revalidateOnFocus: false },
  );

  return { session: session ?? null, isLoading };
}
