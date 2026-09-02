// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, vi, afterEach } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db/connect";
import { buildUserInput, clearCollections } from "@test/support";
import { AppError } from "@/core/domain";
import { UserModel } from "@/models/user.model";
import {
  createUser,
  checkEmailDuplicate,
  getUserEmail,
  getUserById,
  changePassword,
  signupUserService,
  requestPasswordResetService,
  getAdminUsersPageService,
} from "@/services/user";

const sendEmailMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock("@/adapters/server/nodemailer", () => ({ sendEmail: sendEmailMock }));

describe("user", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("createUser", () => {
    it("유저를 생성한다", async () => {
      const input = buildUserInput();

      const created = await createUser(input);

      expect(created.email).toBe(input.email);
      const saved = await UserModel.findOne({ email: input.email });
      expect(saved).not.toBeNull();
    });
  });

  describe("signupUserService", () => {
    it("비밀번호를 해싱해 신규 유저를 생성한다", async () => {
      const input = buildUserInput();

      await signupUserService({ ...input, password: "pw1234!" });

      const saved = await UserModel.findOne({ email: input.email });
      expect(saved).not.toBeNull();
      expect(saved?.password).not.toBe("pw1234!");
    });

    it("중복 이메일이면 VALIDATION을 던진다", async () => {
      const input = buildUserInput();
      await UserModel.create(input);

      await expect(
        signupUserService({ ...input, password: "pw1234!" }),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });
  });

  describe("requestPasswordResetService", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      sendEmailMock.mockClear();
    });

    it("등록된 이메일이면 배포 환경 origin으로 시작하는 절대 링크를 메일로 보낸다", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEPLOYMENT_BASE_URL", "https://tie-knot-pi.vercel.app");
      const input = buildUserInput();
      await UserModel.create(input);

      await requestPasswordResetService(input.email);

      expect(sendEmailMock).toHaveBeenCalledOnce();
      const { path } = sendEmailMock.mock.calls[0][0];
      expect(path).not.toBe("");
      expect(path.startsWith("https://tie-knot-pi.vercel.app/change-password?t=")).toBe(true);
    });

    it("등록되지 않은 이메일이면 VALIDATION을 던진다", async () => {
      await expect(
        requestPasswordResetService("no-such-user@example.com"),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });
  });

  describe("checkEmailDuplicate", () => {
    it("이미 존재하는 이메일이면 true를 리턴한다", async () => {
      const input = buildUserInput();
      await UserModel.create(input);

      const result = await checkEmailDuplicate(input.email);

      expect(result).toBe(true);
    });

    it("존재하지 않는 이메일이면 false를 리턴한다", async () => {
      const result = await checkEmailDuplicate("no-such-user@example.com");

      expect(result).toBe(false);
    });
  });

  describe("getUserEmail", () => {
    it("name/phone이 일치하는 유저의 이메일을 리턴한다", async () => {
      const input = buildUserInput();
      await UserModel.create(input);

      const email = await getUserEmail({ name: input.name, phone: input.phone });

      expect(email).toBe(input.email);
    });

    it("일치하는 유저가 없으면 AppError(NOT_FOUND)를 던진다", async () => {
      await expect(getUserEmail({ name: "없는사람", phone: "010-0000-0000" })).rejects.toBeInstanceOf(
        AppError,
      );
      await expect(
        getUserEmail({ name: "없는사람", phone: "010-0000-0000" }),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
    });
  });

  describe("getUserById", () => {
    it("id로 유저를 조회한다", async () => {
      const input = buildUserInput();
      const saved = await UserModel.create(input);

      const result = await getUserById(saved._id.toString());

      expect(result.email).toBe(input.email);
    });

    it("존재하지 않는 id면 AppError(NOT_FOUND)를 던진다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      await expect(getUserById(missingId)).rejects.toBeInstanceOf(AppError);
      await expect(getUserById(missingId)).rejects.toMatchObject({ category: "NOT_FOUND" });
    });
  });

  describe("changePassword", () => {
    it("비밀번호를 해싱해 갱신하고 true를 리턴한다", async () => {
      const input = buildUserInput({ password: "old-hashed" });
      await UserModel.create(input);

      const result = await changePassword(input.email, "new-plain-password");

      expect(result).toBe(true);
      const updated = await UserModel.findOne({ email: input.email });
      expect(updated?.password).not.toBe("old-hashed");
      expect(updated?.password).not.toBe("new-plain-password");
    });

    it("존재하지 않는 이메일이면 false를 리턴한다", async () => {
      const result = await changePassword("no-such-user@example.com", "new-password");

      expect(result).toBe(false);
    });

    it("탈퇴(deletedAt: 비-null)한 유저는 갱신되지 않는다", async () => {
      const input = buildUserInput({ deletedAt: new Date() });
      await UserModel.create(input);

      const result = await changePassword(input.email, "new-password");

      expect(result).toBe(false);
    });
  });

  describe("getAdminUsersPageService", () => {
    // createdAt은 timestamps가 자동으로 채우고 immutable로 잠그므로, 순서 검증을
    // 위해 덮어쓰려면 두 보호를 모두 풀어야 한다(order.integration.test.ts와 동일 패턴).
    const setCreatedAt = async (userId: mongoose.Types.ObjectId, createdAt: Date) => {
      await UserModel.updateOne(
        { _id: userId },
        { $set: { createdAt } },
        { timestamps: false, overwriteImmutable: true },
      );
    };

    it("createdAt 내림차순으로 정렬한다", async () => {
      const older = await UserModel.create(buildUserInput());
      const newer = await UserModel.create(buildUserInput());
      await setCreatedAt(older._id, new Date("2026-01-01T00:00:00.000Z"));
      await setCreatedAt(newer._id, new Date("2026-02-01T00:00:00.000Z"));

      const result = await getAdminUsersPageService({});

      expect(result.items.map((u) => u.id)).toEqual([
        newer._id.toString(),
        older._id.toString(),
      ]);
    });

    it("같은 createdAt이면 _id 내림차순으로 tie-break한다", async () => {
      const sameCreatedAt = new Date("2026-08-01T00:00:00.000Z");
      const created = [];
      for (let i = 0; i < 3; i += 1) {
        const user = await UserModel.create(buildUserInput());
        await setCreatedAt(user._id, sameCreatedAt);
        created.push(user._id.toString());
      }

      const result = await getAdminUsersPageService({});

      expect(result.items.map((u) => u.id)).toEqual([...created].sort().reverse());
    });

    it("limit을 넘으면 nextCursor로 다음 페이지가 이어지고 행이 중복/누락되지 않는다", async () => {
      const created = [];
      for (let i = 0; i < 3; i += 1) {
        const user = await UserModel.create(buildUserInput());
        await setCreatedAt(user._id, new Date(2026, 0, i + 1));
        created.push(user._id.toString());
      }

      const firstPage = await getAdminUsersPageService({ limit: 2 });
      expect(firstPage.items).toHaveLength(2);
      expect(firstPage.nextCursor).not.toBe(null);

      const secondPage = await getAdminUsersPageService({
        limit: 2,
        cursor: firstPage.nextCursor!,
      });
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.nextCursor).toBe(null);

      const paged = [...firstPage.items, ...secondPage.items].map((u) => u.id);
      expect(new Set(paged).size).toBe(3);
      expect(paged.sort()).toEqual([...created].sort());
    });

    it("마지막 페이지는 nextCursor가 null이다", async () => {
      await UserModel.create(buildUserInput());

      const result = await getAdminUsersPageService({});

      expect(result.nextCursor).toBe(null);
    });

    it("role 필터를 DB 쿼리 단계에서 적용한다", async () => {
      const user = await UserModel.create(buildUserInput({ role: "USER" }));
      await UserModel.create(buildUserInput({ role: "ADMIN" }));

      const result = await getAdminUsersPageService({ role: "USER" });

      expect(result.items.map((u) => u.id)).toEqual([user._id.toString()]);
    });

    it("role 필터와 cursor를 동시에 적용한다", async () => {
      const users = [];
      for (let i = 0; i < 3; i += 1) {
        const user = await UserModel.create(buildUserInput({ role: "USER" }));
        await setCreatedAt(user._id, new Date(2026, 0, i + 1));
        users.push(user);
      }
      await UserModel.create(buildUserInput({ role: "ADMIN" }));

      const firstPage = await getAdminUsersPageService({ role: "USER", limit: 2 });
      const secondPage = await getAdminUsersPageService({
        role: "USER",
        limit: 2,
        cursor: firstPage.nextCursor!,
      });

      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.items[0].role).toBe("USER");
    });

    it("활동 사용자와 탈퇴 사용자를 모두 포함한다(deletedAt으로 제외하지 않는다)", async () => {
      const active = await UserModel.create(buildUserInput({ deletedAt: null }));
      const deleted = await UserModel.create(buildUserInput({ deletedAt: new Date() }));

      const result = await getAdminUsersPageService({});

      expect(result.items.map((u) => u.id).sort()).toEqual(
        [active._id.toString(), deleted._id.toString()].sort(),
      );
    });

    it("빈 DB면 빈 목록과 null 커서를 리턴한다", async () => {
      const result = await getAdminUsersPageService({});

      expect(result).toEqual({ items: [], nextCursor: null });
    });

    it("잘못된 role은 서비스가 방어적으로 VALIDATION을 던진다", async () => {
      await expect(
        getAdminUsersPageService({ role: "SUPERADMIN" as never }),
      ).rejects.toBeInstanceOf(AppError);
    });

    it("형식이 깨진 cursor는 VALIDATION을 던진다", async () => {
      await expect(
        getAdminUsersPageService({ cursor: "!!broken!!" }),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });

    it("잘못된 limit(0)은 VALIDATION을 던진다", async () => {
      await expect(
        getAdminUsersPageService({ limit: 0 }),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });

    it("DTO에 password/phone 등 인증 관련 필드가 없다", async () => {
      await UserModel.create(buildUserInput());

      const result = await getAdminUsersPageService({});

      expect(result.items[0]).not.toHaveProperty("password");
      expect(result.items[0]).not.toHaveProperty("phone");
      expect(Object.keys(result.items[0]).sort()).toEqual(
        ["createdAt", "deletedAt", "email", "id", "name", "role"].sort(),
      );
    });
  });
});
