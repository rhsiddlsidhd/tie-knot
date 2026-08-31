import { TypographyH1, TypographyH2, TypographyMuted, TypographyP } from "@/ui/components/atoms";

interface LegalSection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
}

interface LegalDocumentTemplateProps {
  title: string;
  effectiveDate: string;
  sections: readonly LegalSection[];
}

export function LegalDocumentTemplate({ title, effectiveDate, sections }: LegalDocumentTemplateProps) {
  return (
    <div className="max-w-2xl space-y-10">
      <div className="space-y-2">
        <TypographyH1 className="text-left text-3xl font-bold">{title}</TypographyH1>
        <TypographyMuted>시행일: {effectiveDate}</TypographyMuted>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.heading} className="space-y-3">
            <TypographyH2 className="border-none text-xl font-bold">{section.heading}</TypographyH2>
            {section.paragraphs?.map((paragraph, index) => (
              <TypographyP key={index} className="text-muted-foreground text-sm leading-relaxed">
                {paragraph}
              </TypographyP>
            ))}
            {section.items && (
              <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
