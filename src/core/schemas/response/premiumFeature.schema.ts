import * as z from "zod";

const isoDateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: "ISO date string이 아님",
});

const premiumFeatureResponseSchema = z.object({
  _id: z.string(),
  code: z.string(),
  label: z.string(),
  description: z.string(),
  additionalPrice: z.number(),
  isActive: z.boolean(),
  createdAt: isoDateString,
});

const premiumFeaturesResponseSchema = z.object({
  features: z.array(premiumFeatureResponseSchema),
});

type PremiumFeaturesResponse = z.infer<typeof premiumFeaturesResponseSchema>;

export {
  premiumFeatureResponseSchema,
  premiumFeaturesResponseSchema,
  type PremiumFeaturesResponse,
};
