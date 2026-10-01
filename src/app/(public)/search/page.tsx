import type { Metadata } from "next";
import { ProductSearch } from "@/app/(public)/search/_components/ProductSearch";

const metadata: Metadata = { title: "검색" };

export default function SearchPage() {
  return <ProductSearch />;
}

export { metadata };
