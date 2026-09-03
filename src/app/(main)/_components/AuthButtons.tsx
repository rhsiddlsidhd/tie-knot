"use client";

import { useAuth } from "@/ui/hooks/useAuth";
import { UserAccountNav } from "./UserAccountNav";
import { LoginEntryButton } from "./LoginEntryButton";
import { Skeleton } from "@/ui/components/atoms/skeleton";
export function AuthButtons() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <Skeleton className="h-9 w-9 rounded-md" />;
  if (session) return <UserAccountNav />;
  return <LoginEntryButton />;
}
