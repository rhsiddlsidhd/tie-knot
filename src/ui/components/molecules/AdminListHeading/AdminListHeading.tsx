import {
  TypographyH1,
  TypographyMuted,
} from "@/ui/components/atoms/typography";

interface AdminListHeadingProps {
  title: string;
  subtitle?: string;
}

const AdminListHeading = ({ title, subtitle }: AdminListHeadingProps) => (
  <div>
    <TypographyH1 className="mb-2 text-left text-3xl font-bold">
      {title}
    </TypographyH1>
    {subtitle && <TypographyMuted>{subtitle}</TypographyMuted>}
  </div>
);

export { AdminListHeading };
