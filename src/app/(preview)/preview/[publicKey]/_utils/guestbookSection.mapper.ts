import type { GuestbookListResponse } from "@/core/schemas";
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
  data: GuestbookListResponse,
): GuestbookSectionProps => {
  return {
    id,
    data: data.map((item) => ({
      id: item._id,
      author: item.author,
      message: item.message,
    })),
  };
};
