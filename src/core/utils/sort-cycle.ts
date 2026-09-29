type SortDirection = "asc" | "desc";

interface SortState<S extends string> {
  sort?: S;
  direction?: SortDirection;
}

const getNextSortState = <S extends string>(
  currentSort: S | undefined,
  currentDirection: SortDirection | undefined,
  nextSort: S,
): SortState<S> => {
  if (currentSort !== nextSort) {
    return { sort: nextSort, direction: "desc" };
  }

  if (currentDirection === "desc") {
    return { sort: nextSort, direction: "asc" };
  }

  if (currentDirection === "asc") {
    return { sort: undefined, direction: undefined };
  }

  return { sort: nextSort, direction: "desc" };
};

export { getNextSortState };
export type { SortDirection, SortState };
