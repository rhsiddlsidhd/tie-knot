// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/adapters/server/seoul-open-api/request", () => ({
  fetchSeoulOpenApi: vi.fn(),
}));

import { fetchSeoulOpenApi } from "@/adapters/server/seoul-open-api/request";
import { GET } from "./route";

const buildRequest = (station: string) =>
  new NextRequest(`http://localhost/api/subway/${encodeURIComponent(station)}`);

const call = (station: string) =>
  GET(buildRequest(station), { params: Promise.resolve({ station }) });

describe("GET /api/subway/[station]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("중복 노선을 합치고 노선별 색상을 붙여 리턴한다", async () => {
    vi.mocked(fetchSeoulOpenApi).mockResolvedValue([
      { STATION_NM: "서울역", LINE_NUM: "01호선" },
      { STATION_NM: "서울역", LINE_NUM: "01호선" },
      { STATION_NM: "서울역", LINE_NUM: "04호선" },
    ]);

    const res = await call("서울역");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.station).toBe("서울역");
    expect(body.data.lines.map((line: { name: string }) => line.name)).toEqual([
      "01호선",
      "04호선",
    ]);
    expect(
      body.data.lines.every((line: { color: string }) => Boolean(line.color)),
    ).toBe(true);
  });

  it("알 수 없는 노선명에는 기본 색상을 쓴다", async () => {
    vi.mocked(fetchSeoulOpenApi).mockResolvedValue([
      { STATION_NM: "가상역", LINE_NUM: "99호선" },
    ]);

    const res = await call("가상역");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.lines).toEqual([{ name: "99호선", color: "#6B7280" }]);
  });

  it("조회 결과가 없으면 404를 리턴한다", async () => {
    vi.mocked(fetchSeoulOpenApi).mockResolvedValue([]);

    const res = await call("없는역");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });
});
