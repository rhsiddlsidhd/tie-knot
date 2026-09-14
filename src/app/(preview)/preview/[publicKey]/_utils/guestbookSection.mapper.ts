import type { GuestbookListResponse } from "@/core/schemas/response/guestbook.schema";
interface GuestbookEntryProps {
  id: string;
  author: string;
  message: string;
}

interface GuestbookSectionProps {
  id: string;
  data: GuestbookEntryProps[];
}

const mapDataToGuestbookProps = (
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

export { mapDataToGuestbookProps, type GuestbookEntryProps, type GuestbookSectionProps };
