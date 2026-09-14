import * as z from "zod";

const banksResponseSchema = z.array(
  z.object({
    bank: z.string(),
    name: z.object({ ko: z.string() }),
  }),
);

type BanksResponse = z.infer<typeof banksResponseSchema>;

export { banksResponseSchema, type BanksResponse };
