export interface GuestbookDemoEntry {
  id: string;
  author: string;
  message: string;
  password: string;
}

export interface GuestbookDemoState {
  entries: GuestbookDemoEntry[];
}

export type GuestbookDemoAction =
  | {
      type: "ADD_ENTRY";
      payload: { author: string; message: string; password: string };
    }
  | { type: "REMOVE_ENTRY"; payload: { id: string } };
