import type React from "react";
import { Asterisk } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/atoms/card";

interface FormSectionCardProps extends Omit<
  React.ComponentProps<typeof Card>,
  "title"
> {
  title: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  contentClassName?: string;
}

/** 관련된 폼 입력을 제목과 설명 아래 묶어 보여준다. */
const FormSectionCard = ({
  title,
  description,
  required = false,
  contentClassName,
  children,
  ...cardProps
}: FormSectionCardProps) => {
  return (
    <Card {...cardProps}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1">
          {title}
          {required && <Asterisk aria-hidden="true" size={12} />}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
};

export { FormSectionCard };
export type { FormSectionCardProps };
