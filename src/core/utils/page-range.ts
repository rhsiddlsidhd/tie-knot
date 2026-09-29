type PageRangeItem = number | "ellipsis";

const getPageRange = (
  currentPage: number,
  totalPages: number,
): PageRangeItem[] => {
  if (totalPages <= 0) return [];
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = [
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages,
  ]
    .filter((page) => page >= 1 && page <= totalPages)
    .filter((page, index, pages) => pages.indexOf(page) === index)
    .sort((left, right) => left - right);

  return visiblePages.flatMap((page, index) => {
    const previousPage = visiblePages[index - 1];
    return previousPage !== undefined && page - previousPage > 1
      ? ["ellipsis" as const, page]
      : [page];
  });
};

export { getPageRange };
export type { PageRangeItem };
