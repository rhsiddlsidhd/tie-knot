import type { Metadata } from "next";
import { SupportTemplate } from "@/app/(public)/support/_components/SupportTemplate";

const metadata: Metadata = { title: "고객센터" };

// 정적 셸 — mock 데이터로 화면만 구현, 실제 FAQ/문의 폼(API 연동)은 별도 작업.
export default function SupportPage() {
  return <SupportTemplate />;
}

export { metadata };
