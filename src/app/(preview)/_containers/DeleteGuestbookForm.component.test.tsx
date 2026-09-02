import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/actions/deleteGuestbook", () => ({
  deleteGuestbook: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

import { deleteGuestbook } from "@/actions/deleteGuestbook";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/ui/components/atoms/dialog";
import { createAppStore, type AppStoreApi } from "@/ui/stores/app.store";
import { StoreProvider } from "@/ui/stores/provider";
import { GuestbookDemoProvider, useGuestbookDemo } from "@/ui/context/guestbookDemo/provider";
import { INITIAL_GUESTBOOK_DEMO_STATE } from "@/ui/context/guestbookDemo/reducer";
import { DeleteGuestbookForm } from "./DeleteGuestbookForm";

const TARGET_ID = INITIAL_GUESTBOOK_DEMO_STATE.entries[0].id;
const TARGET_PASSWORD = INITIAL_GUESTBOOK_DEMO_STATE.entries[0].password;

const EntryExistsProbe = () => {
  const [{ entries }] = useGuestbookDemo();
  const stillExists = entries.some((entry) => entry.id === TARGET_ID);
  return <p>대상항목:{stillExists ? "존재" : "삭제됨"}</p>;
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
            <DeleteGuestbookForm payload={payload} />
          </DialogContent>
        </Dialog>
        <EntryExistsProbe />
      </GuestbookDemoProvider>
    </StoreProvider>,
  );

const submitPassword = async (password: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("비밀번호"), password);
  await user.click(screen.getByRole("button", { name: "전송" }));
};

describe("DeleteGuestbookForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createAppStore();
  });

  describe("live (일반 청첩장)", () => {
    it("payload의 id/publicKey로 deleteGuestbook을 호출한다 (useParams 미사용)", async () => {
      vi.mocked(deleteGuestbook).mockResolvedValue({
        success: true,
        data: { message: "게시글이 성공적으로 삭제되었습니다." },
      });
      testStore.getState().setIsOpen({
        isOpen: true,
        type: "DELETE_GUESTBOOK",
        payload: { id: "entry-1", publicKey: "real-invitation" },
      });

      renderForm({ id: "entry-1", publicKey: "real-invitation" });
      await submitPassword("1234");

      await waitFor(() => expect(deleteGuestbook).toHaveBeenCalled());
      const formData = vi.mocked(deleteGuestbook).mock.calls[0][1] as FormData;
      expect(formData.get("guestbookId")).toBe("entry-1");
      expect(formData.get("publicKey")).toBe("real-invitation");

      await waitFor(() =>
        expect(testStore.getState().guestbookModalIsOpen).toBe(false),
      );
      expect(toast).toHaveBeenCalledWith("게시글이 성공적으로 삭제되었습니다.");
    });
  });

  describe("demo (/preview/sample)", () => {
    it("비밀번호가 맞으면 실제 Server Action 없이 항목을 제거한다", async () => {
      renderForm({ id: TARGET_ID, publicKey: "sample" });
      expect(screen.getByText("대상항목:존재")).toBeInTheDocument();

      await submitPassword(TARGET_PASSWORD);

      await waitFor(() =>
        expect(screen.getByText("대상항목:삭제됨")).toBeInTheDocument(),
      );
      expect(deleteGuestbook).not.toHaveBeenCalled();
    });

    it("비밀번호가 틀리면 항목을 유지하고 기존과 동일하게 오류를 표시한다", async () => {
      renderForm({ id: TARGET_ID, publicKey: "sample" });

      await submitPassword("wrong-password");

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("비밀번호가 일치하지 않습니다."),
      );
      expect(screen.getByText("대상항목:존재")).toBeInTheDocument();
      expect(deleteGuestbook).not.toHaveBeenCalled();
    });

    it("데모 안내 문구를 표시한다", () => {
      renderForm({ id: TARGET_ID, publicKey: "sample" });

      expect(
        screen.getByText("데모 페이지의 방명록은 저장되지 않습니다."),
      ).toBeInTheDocument();
    });
  });
});
