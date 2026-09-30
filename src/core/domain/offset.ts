type OffsetPage<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type OffsetPageInfo = Pick<OffsetPage<unknown>, "total" | "totalPages">;

export type { OffsetPage, OffsetPageInfo };
