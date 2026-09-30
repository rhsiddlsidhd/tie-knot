import type { ReactNode } from "react";

import {
  TypographyH1,
  TypographyMuted,
} from "@/ui/components/atoms/typography";

interface ListPageProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const ListPage = ({ title, description, children }: ListPageProps) => (
  <div className="space-y-6">
    <div>
      <TypographyH1 className="mb-2 text-left text-3xl font-bold">
        {title}
      </TypographyH1>
      {description && <TypographyMuted>{description}</TypographyMuted>}
    </div>
    {children}
  </div>
);

export { ListPage };
export type { ListPageProps };
