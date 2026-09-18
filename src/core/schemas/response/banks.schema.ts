import * as z from "zod";

const BanksResponseSchema = z.array(
  z.object({
    bank: z.string(),
    name: z.object({ ko: z.string() }),
  }),
);

type BanksResponse = z.infer<typeof BanksResponseSchema>;

export { BanksResponseSchema, type BanksResponse };
