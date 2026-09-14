import type { CursorPage } from "./cursor";

interface GuestbookEntry {
  id: string;
  author: string;
  message: string;
  isPrivate: boolean;
  createdAt: Date;
}

type GuestbookListPage = CursorPage<GuestbookEntry>;

export { type GuestbookEntry, type GuestbookListPage };
