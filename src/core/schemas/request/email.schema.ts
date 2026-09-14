import * as z from "zod";

const emailSchema = z.object({
  email: z.email({
    message: "이메일 형식이 올바르지 않습니다.",
  }),
});

export { emailSchema };
