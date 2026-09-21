"use client";

import { Button } from "@/ui/components/atoms/button";
import { Card, CardContent } from "@/ui/components/atoms/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/ui/components/atoms/accordion";
import { Input } from "@/ui/components/atoms/input";
import { Field, FieldGroup, FieldLabel } from "@/ui/components/atoms/field";
import { TextareaField } from "@/ui/components/organisms/TextareaField";
import {
  TypographyH1,
  TypographyH2,
  TypographyMuted,
} from "@/ui/components/atoms/typography";
import { MOCK_FAQS } from "../_constants/faqs";

const SupportTemplate = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("문의 등록 기능은 준비 중입니다");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <TypographyH1 className="mb-2 text-left text-3xl font-bold">
            고객센터
          </TypographyH1>
          <TypographyMuted>
            자주 묻는 질문을 확인하거나 1:1 문의를 남겨주세요.
          </TypographyMuted>
        </div>

        <div className="space-y-4">
          <TypographyH2 className="border-none text-xl font-bold">
            자주 묻는 질문
          </TypographyH2>
          <Accordion type="single" collapsible className="space-y-2">
            {MOCK_FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question} asChild>
                <Card className="gap-0 px-4 py-0">
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground border-t pt-3 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="space-y-4">
          <TypographyH2 className="border-none text-xl font-bold">
            1:1 문의하기
          </TypographyH2>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="inquiryTitle">제목</FieldLabel>
                    <Input
                      id="inquiryTitle"
                      placeholder="문의 제목을 입력해주세요"
                    />
                  </Field>
                  <TextareaField
                    id="inquiryContent"
                    name="inquiryContent"
                    label="문의 내용"
                    rows={4}
                    placeholder="문의하실 내용을 자세히 적어주세요."
                  />
                  <Button type="submit" className="w-full">
                    문의 등록하기
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { SupportTemplate };
