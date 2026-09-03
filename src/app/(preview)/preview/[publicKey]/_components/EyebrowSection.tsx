import { TypographyEyebrow, TypographyLead } from "@/ui/components/atoms/typography";
import React from "react";

interface EyebrowSectionProps {
  eyebrow: string;
  heading: string;
  children: React.ReactNode;
}

const EyebrowSection = ({ eyebrow, heading, children }: EyebrowSectionProps) => {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <TypographyEyebrow className="text-primary">{eyebrow}</TypographyEyebrow>
        <TypographyLead className="text-foreground p-4 font-[var(--font-NotoSerif)] font-semibold sm:text-2xl">
          {heading}
        </TypographyLead>
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
};

export { EyebrowSection };
