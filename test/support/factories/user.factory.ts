import type { UserRole } from "@/models";

type BuildUserInput = {
  email: string;
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  deletedAt: Date | null;
};

export const buildUserInput = (overrides?: Partial<BuildUserInput>): BuildUserInput => ({
  email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
  name: "홍길동",
  phone: "010-1234-5678",
  password: "hashed-password",
  role: "USER",
  deletedAt: null,
  ...overrides,
});
