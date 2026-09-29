// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";
import type { AdminUserListPage } from "@/core/domain/user";

vi.mock("@/services/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/services/user", () => ({ getAdminUsersPageService: vi.fn() }));

import { requireAdmin } from "@/services/auth";
import { getAdminUsersPageService } from "@/services/user";
import { GET } from "./route";

const request = (query = "") =>
  new NextRequest(`http://localhost/api/admin/users${query}`);
const emptyPage: AdminUserListPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      userId: "1",
      role: "ADMIN",
      email: "a@x.com",
    });
  });

  it.each([
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
  ] as const)("%s를 %i로 반환한다", async (category, status) => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new AppError(category, "실패"),
    );
    expect((await GET(request())).status).toBe(status);
    expect(getAdminUsersPageService).not.toHaveBeenCalled();
  });

  it("형식 오류를 400으로 반환한다", async () => {
    expect((await GET(request("?role=OWNER"))).status).toBe(400);
    expect(getAdminUsersPageService).not.toHaveBeenCalled();
  });

  it("정규화한 요청으로 서비스를 호출한다", async () => {
    vi.mocked(getAdminUsersPageService).mockResolvedValue(emptyPage);
    await GET(
      request(
        "?page=2&limit=20&q=%20kim%20&role=ADMIN&sort=name&direction=asc",
      ),
    );
    expect(getAdminUsersPageService).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      q: "kim",
      role: "ADMIN",
      sort: "name",
      direction: "asc",
    });
  });
});
