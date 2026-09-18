import * as z from "zod";

const AuthSessionSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
  email: z.string(),
  userId: z.string(),
});

type AuthSession = z.infer<typeof AuthSessionSchema>;

// /api/auth/me 응답 전용 — 세션 없으면 null
const AuthSessionResponseSchema = AuthSessionSchema.nullable();

type AuthSessionResponse = z.infer<typeof AuthSessionResponseSchema>;

export {
  AuthSessionSchema,
  AuthSessionResponseSchema,
  type AuthSession,
  type AuthSessionResponse,
};
