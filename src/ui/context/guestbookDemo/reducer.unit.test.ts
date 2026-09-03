import { describe, expect, it } from "vitest";
import { guestbookDemoReducer } from "./reducer";
import type { GuestbookDemoEntry, GuestbookDemoState } from "./type";

const buildEntry = (id: string): GuestbookDemoEntry => ({
  id,
  author: "홍길동",
  message: "축하합니다",
  password: "0000",
});

const buildState = (entries: GuestbookDemoEntry[]): GuestbookDemoState => ({
  entries,
});

const addEntryAction = {
  type: "ADD_ENTRY" as const,
  payload: { author: "새 손님", message: "축하해요", password: "1234" },
};

describe("guestbookDemoReducer", () => {
  it("기존 demo-N 최댓값보다 1 큰 id를 다음 항목에 부여한다", () => {
    const state = buildState([buildEntry("demo-3"), buildEntry("demo-1")]);

    const result = guestbookDemoReducer(state, addEntryAction);

    expect(result.entries[0]?.id).toBe("demo-4");
  });

  it("중간 항목을 삭제한 뒤 추가해도 남아있는 최댓값 기준으로 id가 충돌하지 않는다", () => {
    const state = buildState([buildEntry("demo-5"), buildEntry("demo-3")]);
    const afterRemove = guestbookDemoReducer(state, {
      type: "REMOVE_ENTRY",
      payload: { id: "demo-5" },
    });

    const result = guestbookDemoReducer(afterRemove, addEntryAction);

    expect(afterRemove.entries.map((entry) => entry.id)).toEqual(["demo-3"]);
    expect(result.entries[0]?.id).toBe("demo-4");
    expect(
      result.entries.filter((entry) => entry.id === "demo-4"),
    ).toHaveLength(1);
  });

  it("추가한 항목을 목록 맨 앞에 삽입하고 payload 필드를 그대로 반영한다", () => {
    const state = buildState([buildEntry("demo-1")]);

    const result = guestbookDemoReducer(state, addEntryAction);

    expect(result.entries[0]).toEqual({
      id: "demo-2",
      author: "새 손님",
      message: "축하해요",
      password: "1234",
    });
    expect(result.entries).toHaveLength(2);
  });

  it("id로 지정한 항목을 제거한다", () => {
    const state = buildState([buildEntry("demo-2"), buildEntry("demo-1")]);

    const result = guestbookDemoReducer(state, {
      type: "REMOVE_ENTRY",
      payload: { id: "demo-2" },
    });

    expect(result.entries.map((entry) => entry.id)).toEqual(["demo-1"]);
  });
});
