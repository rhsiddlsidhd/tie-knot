import type { SortState } from "@/core/utils/sort-cycle";

type OffsetListParamSpec = Record<string, readonly string[]>;

type OffsetListParams<P extends OffsetListParamSpec> = {
  [K in keyof P]: P[K][number] | null;
};

interface OffsetListQueryState<
  S extends string,
  P extends OffsetListParamSpec,
> {
  page: number;
  q: string;
  sortState: SortState<S>;
  params: OffsetListParams<P>;
  namesToRemove: readonly string[];
}

interface ParseOffsetListQueryOptions<
  S extends string,
  P extends OffsetListParamSpec,
> {
  sortKeys: readonly S[];
  params: P;
}

type SearchParamsReader = Pick<URLSearchParams, "get" | "has">;

const getPage = (value: string | null): number => {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
};

const getAllowedValue = <V extends string>(
  value: string | null,
  allowedValues: readonly V[],
): V | null => {
  const trimmedValue = value?.trim();
  return allowedValues.find((allowed) => allowed === trimmedValue) ?? null;
};

const parseOffsetListQuery = <S extends string, P extends OffsetListParamSpec>(
  searchParams: SearchParamsReader,
  { sortKeys, params: paramSpec }: ParseOffsetListQueryOptions<S, P>,
): OffsetListQueryState<S, P> => {
  const page = getPage(searchParams.get("page"));
  const q = searchParams.get("q")?.trim() ?? "";
  const sortKey = getAllowedValue(searchParams.get("sort"), sortKeys);
  const directionValue = searchParams.get("direction");
  const hasInvalidDirection =
    directionValue !== null &&
    directionValue !== "asc" &&
    directionValue !== "desc";
  const sortState: SortState<S> = sortKey
    ? {
        key: sortKey,
        direction: directionValue === "asc" ? "asc" : "desc",
      }
    : null;
  const paramNames = Object.keys(paramSpec) as (keyof P & string)[];
  const params = Object.fromEntries(
    paramNames.map((name) => [
      name,
      getAllowedValue(searchParams.get(name), paramSpec[name]),
    ]),
  ) as OffsetListParams<P>;
  const namesToRemove = [
    ...(searchParams.has("page") && page === 1 ? ["page"] : []),
    ...(sortKey
      ? hasInvalidDirection
        ? ["direction"]
        : []
      : ["sort", "direction"]),
    ...paramNames.filter((name) => params[name] === null),
  ].filter((name) => searchParams.has(name));

  return { page, q, sortState, params, namesToRemove };
};

const buildOffsetListKey = <S extends string, P extends OffsetListParamSpec>(
  endpoint: string,
  state: OffsetListQueryState<S, P>,
): string => {
  const keyParams = new URLSearchParams();
  keyParams.set("page", String(state.page));
  if (state.q) keyParams.set("q", state.q);
  if (state.sortState) {
    keyParams.set("sort", state.sortState.key);
    keyParams.set("direction", state.sortState.direction);
  }
  Object.entries(state.params).forEach(([name, value]) => {
    if (value !== null) keyParams.set(name, value);
  });

  return `${endpoint}?${keyParams.toString()}`;
};

export { buildOffsetListKey, parseOffsetListQuery };
export type { OffsetListParams, OffsetListParamSpec };
