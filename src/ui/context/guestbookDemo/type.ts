interface GuestbookDemoEntry {
  id: string;
  author: string;
  message: string;
  password: string;
}

interface GuestbookDemoState {
  entries: GuestbookDemoEntry[];
}

type GuestbookDemoAction =
  | {
      type: "ADD_ENTRY";
      payload: { author: string; message: string; password: string };
    }
  | { type: "REMOVE_ENTRY"; payload: { id: string } };

export { type GuestbookDemoEntry, type GuestbookDemoState, type GuestbookDemoAction };
