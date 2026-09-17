import Link from "next/link";
import { Gem } from "lucide-react";
import { ROUTES } from "@/core/domain/routes";

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <Link
      href={ROUTES.home}
      className={
        className ??
        "text-foreground flex items-center gap-2 text-base font-semibold tracking-widest whitespace-nowrap uppercase"
      }
    >
      <Gem className="text-muted-foreground h-4 w-4" strokeWidth={1.5} />
      Tie Knot
    </Link>
  );
};

export { Logo };
