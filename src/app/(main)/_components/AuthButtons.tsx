"use client";

import { useAuth } from "@/ui/hooks";
import { UserAccountNav } from "./UserAccountNav";
import { LoginEntryButton } from "@/ui/components/molecules";
import { Skeleton } from "@/ui/components/atoms";
export function AuthButtons() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <Skeleton className="h-9 w-9 rounded-md" />;
  if (session) return <UserAccountNav />;
  return <LoginEntryButton />;
}
