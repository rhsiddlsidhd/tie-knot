import type { CursorPage } from "./cursor";

export interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  isPrivate: boolean;
  createdAt: Date;
}

export type GuestbookListPage = CursorPage<GuestbookEntry>;
