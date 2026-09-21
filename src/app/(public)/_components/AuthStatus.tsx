"use client";

import { useAuth } from "@/ui/hooks/useAuth";
import { AccountMenu } from "./AccountMenu";
import { LinkButton } from "@/ui/components/molecules/LinkButton";
import { ROUTES } from "@/core/domain/routes";
import { Skeleton } from "@/ui/components/atoms/skeleton";

const AuthStatus = () => {
  const { session, isLoading } = useAuth();
  if (isLoading) return <Skeleton className="h-9 w-9 rounded-md" />;
  if (session) return <AccountMenu />;
  return (
    <LinkButton variant="ghost" size="sm" href={ROUTES.login}>
      로그인
    </LinkButton>
  );
};

export { AuthStatus };
