import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useOffsetListMock, deletePremiumFeatureMock } = vi.hoisted(() => ({
  useOffsetListMock: vi.fn(),
  deletePremiumFeatureMock: vi.fn(),
}));

vi.mock("@/ui/hooks/useOffsetList", () => ({
  useOffsetList: useOffsetListMock,
}));
vi.mock("@/actions/deletePremiumFeature", () => ({
  deletePremiumFeature: deletePremiumFeatureMock,
}));

import { createAppStore } from "@/ui/stores/app.store";
import type { AppStoreApi } from "@/ui/stores/app.store";
import { StoreProvider } from "@/ui/stores/provider";
import { PremiumFeaturesTable } from "./PremiumFeaturesTable";

const buildTable = (overrides: Record<string, unknown> = {}) => ({
  items: [
    {
      _id: "feature-1",
      code: "GALLERY_LIGHTBOX",
      label: "갤러리 확대 보기",
      description: "사진을 크게 볼 수 있습니다.",
      additionalPrice: 3000,
      isActive: true,
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  total: 21,
  totalPages: 3,
  isLoading: false,
  isValidating: false,
  error: undefined as { message: string } | undefined,
  mutate: vi.fn(),
  page: 1,
  q: "",
  sort: undefined as string | undefined,
  direction: undefined as "asc" | "desc" | undefined,
  params: {},
  setPage: vi.fn(),
  setSearch: vi.fn(),
  toggleSort: vi.fn(),
  setParam: vi.fn(),
  ...overrides,
});

let testStore: AppStoreApi;

const renderTable = () =>
  render(
    <StoreProvider store={testStore}>
      <PremiumFeaturesTable />
    </StoreProvider>,
  );

afterEach(() => vi.useRealTimers());

describe("PremiumFeaturesTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createAppStore();
  });

  it("프리미엄 기능 API를 조회하고 제목·등록 버튼·열을 렌더링한다", () => {
    useOffsetListMock.mockReturnValue(buildTable());
    renderTable();

    expect(useOffsetListMock).toHaveBeenCalledWith({
      endpoint: "/api/admin/premium-features",
    });
    expect(
      screen.getByRole("heading", { name: "프리미엄 기능 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("상품에 추가할 수 있는 유료 기능을 관리합니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기능 등록" })).toHaveAttribute(
      "href",
      "/admin/premium-features/new",
    );
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "기능 코드",
      "기능 이름",
      "설명",
      "추가 비용",
      "상태",
      "등록일",
      "관리",
    ]);
    expect(screen.getByText("+3,000원")).toBeInTheDocument();
  });

  it("기능 이름·추가 비용·등록일 열로 정렬을 바꾼다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "기능 이름 정렬" }));
    await user.click(screen.getByRole("button", { name: "추가 비용 정렬" }));
    await user.click(screen.getByRole("button", { name: "등록일 정렬" }));

    expect(table.toggleSort.mock.calls).toEqual([
      ["label"],
      ["additionalPrice"],
      ["createdAt"],
    ]);
  });

  it("페이지 버튼을 누르면 해당 페이지로 이동한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "2페이지" }));

    expect(table.setPage).toHaveBeenCalledWith(2);
  });

  it("검색어를 입력하면 debounce 뒤 검색을 반영한다", () => {
    vi.useFakeTimers();
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    renderTable();

    fireEvent.change(screen.getByRole("searchbox", { name: "기능 검색" }), {
      target: { value: "갤러리" },
    });
    act(() => vi.advanceTimersByTime(300));

    expect(table.setSearch).toHaveBeenCalledWith("갤러리");
  });

  it("기능을 삭제하면 목록을 다시 조회한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    deletePremiumFeatureMock.mockResolvedValue({
      success: true,
      data: { message: "프리미엄 기능이 삭제되었습니다." },
    });
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "기능 삭제" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );

    expect(deletePremiumFeatureMock).toHaveBeenCalledWith("feature-1");
    expect(table.mutate).toHaveBeenCalledOnce();
  });

  it("수정 모달에 목록 갱신 callback을 넘긴다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "기능 수정" }));
    const props = testStore.getState().props as { onRefreshed: () => void };
    props.onRefreshed();

    expect(testStore.getState().adminModalType).toBe("EDIT-PREMIUMFEATURE");
    expect(table.mutate).toHaveBeenCalledOnce();
  });
});
