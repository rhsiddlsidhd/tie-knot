export const dynamic = "force-dynamic";

import { ProductDetailTemplate } from "./_components";
import { getPremiumFeatureService, getProductService } from "@/services";

import { notFound } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { id } = await params;

  const product = await getProductService(id);

  if (!product) notFound();
  const options = await getPremiumFeatureService(product.featureIds);

  return <ProductDetailTemplate product={product} options={options} />;
}
