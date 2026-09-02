import type { GuestbookListResponse } from "@/core/schemas/response/guestbook.schema";
export interface GuestbookEntryProps {
  id: string;
  author: string;
  message: string;
}

export interface GuestbookSectionProps {
  id: string;
  data: GuestbookEntryProps[];
}

export const mapDataToGuestbookProps = (
  id: string,
  pages: GuestbookListResponse[],
): GuestbookSectionProps => {
  return {
    id,
    data: pages
      .flatMap((page) => page.items)
      .map((item) => ({
        id: item._id,
        author: item.author,
        message: item.message,
      })),
  };
};
