"use client";

import { useState } from "react";
import { Button } from "@/ui/components/atoms/button";
import { Card, CardContent } from "@/ui/components/atoms/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/components/atoms/collapsible";
import { Input } from "@/ui/components/atoms/input";
import { Label } from "@/ui/components/atoms/label";
import { Textarea } from "@/ui/components/atoms/textarea";
import { TypographyH1, TypographyH2, TypographyMuted } from "@/ui/components/atoms/typography";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { MOCK_FAQS } from "../_constants";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="gap-0 py-0">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium"
          >
            <span>{question}</span>
            <ChevronDown
              className={clsx(
                "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="text-muted-foreground border-t px-4 py-3 text-sm leading-relaxed">
            {answer}
          </p>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

const SupportTemplate = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("문의 등록 기능은 준비 중입니다");
  };

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <TypographyH1 className="text-left mb-2 text-3xl font-bold">
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
        <div className="space-y-2">
          {MOCK_FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <TypographyH2 className="border-none text-xl font-bold">
          1:1 문의하기
        </TypographyH2>
        <Card>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="inquiryTitle">제목</Label>
                <Input id="inquiryTitle" placeholder="문의 제목을 입력해주세요" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inquiryContent">문의 내용</Label>
                <Textarea
                  id="inquiryContent"
                  rows={4}
                  placeholder="문의하실 내용을 자세히 적어주세요."
                />
              </div>
              <Button type="submit" className="w-full">
                문의 등록하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { SupportTemplate };
