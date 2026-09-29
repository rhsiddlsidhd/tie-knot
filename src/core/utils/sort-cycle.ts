type SortDirection = "asc" | "desc";

type SortState<S extends string> = { key: S; direction: SortDirection } | null;

const getNextSortState = <S extends string>(
  current: SortState<S>,
  nextKey: S,
): SortState<S> => {
  if (current?.key !== nextKey) {
    return { key: nextKey, direction: "desc" };
  }

  if (current.direction === "desc") {
    return { key: nextKey, direction: "asc" };
  }

  return null;
};

export { getNextSortState };
export type { SortDirection, SortState };
