import type { ReactNode } from "react";

import { AdminListHeading } from "@/ui/components/molecules/AdminListHeading";

interface ListPageProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const ListPage = ({ title, description, actions, children }: ListPageProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <AdminListHeading title={title} subtitle={description} />
      {actions}
    </div>
    {children}
  </div>
);

export { ListPage };
export type { ListPageProps };
