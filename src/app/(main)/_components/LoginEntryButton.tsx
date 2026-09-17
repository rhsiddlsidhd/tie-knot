import { LinkButton } from "@/ui/components/molecules/LinkButton";
import { ROUTES } from "@/core/domain/routes";

const LoginEntryButton = () => {
  return (
    <LinkButton variant="ghost" size="sm" href={ROUTES.login}>
      로그인
    </LinkButton>
  );
};

export { LoginEntryButton };
