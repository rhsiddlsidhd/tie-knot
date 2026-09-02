import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock("@/actions/createGuestbook", () => ({
  createGuestbook: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { message: vi.fn(), error: vi.fn() }),
}));

import { createGuestbook } from "@/actions/createGuestbook";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/ui/components/atoms";
import { createAppStore, StoreProvider, type AppStoreApi } from "@/ui/stores";
import {
  GuestbookDemoProvider,
  INITIAL_GUESTBOOK_DEMO_STATE,
  useGuestbookDemo,
} from "@/ui/context/guestbookDemo";
import { CreateGuestbookForm } from "./CreateGuestbookForm";

const DemoEntriesProbe = () => {
  const [{ entries }] = useGuestbookDemo();
  return <p>최신항목:{entries[0]?.author ?? "없음"}</p>;
};

let testStore: AppStoreApi;

// 순수 organism이 Radix DialogTitle/DialogFooter 등을 쓰므로, 실제 GuestbookModal과
// 동일하게 Dialog 컨텍스트 안에서 렌더해야 한다.
const renderForm = (payload: unknown) =>
  render(
    <StoreProvider store={testStore}>
      <GuestbookDemoProvider initialValue={INITIAL_GUESTBOOK_DEMO_STATE}>
        <Dialog open>
          <DialogContent>
            <CreateGuestbookForm payload={payload} />
          </DialogContent>
        </Dialog>
        <DemoEntriesProbe />
      </GuestbookDemoProvider>
    </StoreProvider>,
  );

const fillAndSubmit = async (author: string, password: string, message: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("이름"), author);
  await user.type(screen.getByLabelText("비밀번호"), password);
  await user.type(screen.getByLabelText("메시지"), message);
  await user.click(screen.getByRole("button", { name: "축하 글 전달하기" }));
};

describe("CreateGuestbookForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createAppStore();
  });

  describe("live (일반 청첩장)", () => {
    it("성공 시 createGuestbook을 호출하고 모달을 닫은 뒤 새로고침한다", async () => {
      vi.mocked(createGuestbook).mockResolvedValue({
        success: true,
        data: { message: "방명록 작성이 완료되었습니다." },
      });
      testStore.getState().setIsOpen({
        isOpen: true,
        type: "WRITE_GUESTBOOK",
        payload: { publicKey: "real-invitation" },
      });

      renderForm({ publicKey: "real-invitation" });
      await fillAndSubmit("하객1", "1234", "축하합니다");

      await waitFor(() => expect(createGuestbook).toHaveBeenCalled());
      await waitFor(() =>
        expect(testStore.getState().guestbookModalIsOpen).toBe(false),
      );
      expect(refreshMock).toHaveBeenCalled();
      expect(toast.message).toHaveBeenCalledWith("방명록 작성이 완료되었습니다.");
      expect(screen.getByText("최신항목:박서준")).toBeInTheDocument();
    });
  });

  describe("demo (/preview/sample)", () => {
    it("실제 Server Action을 호출하지 않고 새 항목을 목록 맨 위에 추가한다", async () => {
      renderForm({ publicKey: "sample" });

      await fillAndSubmit("데모작성자", "1234", "데모 메시지");

      await waitFor(() =>
        expect(screen.getByText("최신항목:데모작성자")).toBeInTheDocument(),
      );
      expect(createGuestbook).not.toHaveBeenCalled();
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it("데모 안내 문구를 표시한다", () => {
      renderForm({ publicKey: "sample" });

      expect(
        screen.getByText("데모 페이지의 방명록은 저장되지 않습니다."),
      ).toBeInTheDocument();
    });

    it("비밀번호가 너무 짧으면 실제 항목을 추가하지 않고 필드 에러를 보여준다", async () => {
      renderForm({ publicKey: "sample" });

      await fillAndSubmit("데모작성자", "12", "데모 메시지");

      await waitFor(() =>
        expect(
          screen.getByText("비밀번호는 최소 4자 이상이어야 합니다"),
        ).toBeInTheDocument(),
      );
      expect(screen.getByText("최신항목:박서준")).toBeInTheDocument();
    });
  });
});
