import * as React from "react";
import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { Button, type buttonVariants } from "@/ui/components/atoms/button";

type LinkButtonProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

const LinkButton = ({
  variant,
  size,
  className,
  ...props
}: LinkButtonProps) => {
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link {...props} />
    </Button>
  );
};

export { LinkButton };
