import * as z from "zod";

const isoDateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: "ISO date string이 아님",
});

const PremiumFeatureResponseSchema = z.object({
  _id: z.string(),
  code: z.string(),
  label: z.string(),
  description: z.string(),
  additionalPrice: z.number(),
  isActive: z.boolean(),
  createdAt: isoDateString,
});

const PremiumFeaturesResponseSchema = z.object({
  features: z.array(PremiumFeatureResponseSchema),
});

type PremiumFeaturesResponse = z.infer<typeof PremiumFeaturesResponseSchema>;

export {
  PremiumFeatureResponseSchema,
  PremiumFeaturesResponseSchema,
  type PremiumFeaturesResponse,
};
