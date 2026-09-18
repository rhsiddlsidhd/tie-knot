"use client";

import { mutate } from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutUser } from "@/actions/logoutUser";
import { ROUTES } from "@/core/domain/routes";

const useLogout = () => {
  const router = useRouter();

  const logout = async () => {
    const result = await logoutUser();

    if (result.success === false) {
      toast.error(
        result.error.message || "로그아웃 처리 중 오류가 발생했습니다.",
      );
      return;
    }

    mutate("/api/auth/me", null, false);
    toast.success("로그아웃되었습니다.");

    router.push(ROUTES.home);
    router.refresh();
  };

  return { logout };
};

export { useLogout };
