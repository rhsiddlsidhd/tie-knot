import * as z from "zod";

const authSessionSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
  email: z.string(),
  userId: z.string(),
});

type AuthSession = z.infer<typeof authSessionSchema>;

// /api/auth/me 응답 전용 — 세션 없으면 null
const authSessionResponseSchema = authSessionSchema.nullable();

type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;

export { authSessionSchema, authSessionResponseSchema, type AuthSession, type AuthSessionResponse };
