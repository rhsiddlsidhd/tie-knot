import type { CursorPage } from "./cursor";

type PremiumFeature = {
  _id: string;
  code: string;
  label: string;
  description: string;
  additionalPrice: number;
  isActive: boolean;
  createdAt: string;
};

type AdminPremiumFeatureListPage = CursorPage<PremiumFeature>;

export { type PremiumFeature, type AdminPremiumFeatureListPage };
