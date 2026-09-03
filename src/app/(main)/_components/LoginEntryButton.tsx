import { Button } from "@/ui/components/atoms/button";
import Link from "next/link";
import { routes } from "@/core/domain/routes";

const LoginEntryButton = () => {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={routes.login}>로그인</Link>
    </Button>
  );
};

export { LoginEntryButton };
