import * as React from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { Button, type buttonVariants } from "@/ui/components/atoms/button";

type LinkButtonProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    /**
     * true면 Link 대신 disabled <button>을 렌더한다 — <a>에는 disabled가 없어
     * aria-disabled·pointer-events 흉내로는 클릭·포커스·prefetch를 다 못 막는다.
     * 이때 href 등 Link props는 무시된다.
     */
    disabled?: boolean;
  };

const LinkButton = ({
  variant,
  size,
  className,
  disabled = false,
  children,
  ...props
}: LinkButtonProps) => {
  if (disabled) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        {children}
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link {...props}>{children}</Link>
    </Button>
  );
};

export { LinkButton };
