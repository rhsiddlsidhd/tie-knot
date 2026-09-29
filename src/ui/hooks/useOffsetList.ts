"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";

import type { ErrorPayload } from "@/core/domain/error";
import type { OffsetPage, OffsetPageInfo } from "@/core/domain/offset";
import type { SortState } from "@/core/utils/sort-cycle";
import { getNextSortState } from "@/core/utils/sort-cycle";
import { fetcher } from "@/ui/fetcher";

// 페이지 전용 URL 값 이름 → 허용값 목록. 허용값 밖의 URL 값은 null로 본다.
type OffsetListParamSpec = Record<string, readonly string[]>;

type OffsetListParams<P extends OffsetListParamSpec> = {
  [K in keyof P]: P[K][number] | null;
};

interface UseOffsetListOptions<
  S extends string,
  P extends OffsetListParamSpec,
> {
  endpoint: string;
  sortKeys: readonly S[];
  params: P;
}

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

const useOffsetList = <
  T,
  S extends string,
  P extends OffsetListParamSpec = Record<never, never>,
>({
  endpoint,
  sortKeys,
  params: paramSpec,
}: UseOffsetListOptions<S, P>) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = getPage(searchParams.get("page"));
  const q = searchParams.get("q")?.trim() ?? "";
  const sortKey = getAllowedValue(searchParams.get("sort"), sortKeys);
  const directionValue = searchParams.get("direction");
  const sortState = useMemo<SortState<S>>(
    () =>
      sortKey
        ? {
            key: sortKey,
            direction: directionValue === "asc" ? "asc" : "desc",
          }
        : null,
    [directionValue, sortKey],
  );
  const paramNames = Object.keys(paramSpec) as (keyof P & string)[];
  const params = Object.fromEntries(
    paramNames.map((name) => [
      name,
      getAllowedValue(searchParams.get(name), paramSpec[name]),
    ]),
  ) as OffsetListParams<P>;

  // 허용되지 않은 URL 값은 SWR key에서 빠져 서버 기본값이 적용된다.
  // URL은 다음 조작 때 함께 정리한다.
  const invalidNames = [
    ...(sortState ? [] : ["sort", "direction"]),
    ...paramNames.filter((name) => params[name] === null),
  ].filter((name) => searchParams.has(name));
  const invalidKey = invalidNames.join(" ");

  const keyParams = new URLSearchParams();
  keyParams.set("page", String(page));
  if (q) keyParams.set("q", q);
  if (sortState) {
    keyParams.set("sort", sortState.key);
    keyParams.set("direction", sortState.direction);
  }
  paramNames.forEach((name) => {
    const value = params[name];
    if (value) keyParams.set(name, value);
  });
  const key = `${endpoint}?${keyParams.toString()}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    OffsetPage<T>,
    ErrorPayload
  >(key, fetcher, { keepPreviousData: true });

  const createHref = useCallback(
    (update: (nextParams: URLSearchParams) => void) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      invalidKey.split(" ").forEach((name) => nextParams.delete(name));
      update(nextParams);
      const query = nextParams.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [invalidKey, pathname, searchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const href = createHref((nextParams) => {
        if (nextPage <= 1) nextParams.delete("page");
        else nextParams.set("page", String(nextPage));
      });
      window.history.pushState(null, "", href);
    },
    [createHref],
  );

  const setSearch = useCallback(
    (nextSearch: string) => {
      const href = createHref((nextParams) => {
        const trimmedSearch = nextSearch.trim();
        nextParams.delete("page");
        if (trimmedSearch) nextParams.set("q", trimmedSearch);
        else nextParams.delete("q");
      });
      window.history.replaceState(null, "", href);
    },
    [createHref],
  );

  const toggleSort = useCallback(
    (nextSort: S) => {
      const nextState = getNextSortState(sortState, nextSort);
      const href = createHref((nextParams) => {
        nextParams.delete("page");
        if (nextState) {
          nextParams.set("sort", nextState.key);
          nextParams.set("direction", nextState.direction);
        } else {
          nextParams.delete("sort");
          nextParams.delete("direction");
        }
      });
      window.history.replaceState(null, "", href);
    },
    [createHref, sortState],
  );

  const setParam = useCallback(
    <K extends keyof P & string>(name: K, value: P[K][number] | null) => {
      const href = createHref((nextParams) => {
        nextParams.delete("page");
        if (value) nextParams.set(name, value);
        else nextParams.delete(name);
      });
      window.history.replaceState(null, "", href);
    },
    [createHref],
  );

  // 응답 전에는 건수를 모른다 — 0건과 구분하려고 null로 둔다.
  const pageInfo = useMemo<OffsetPageInfo | null>(
    () => (data ? { total: data.total, totalPages: data.totalPages } : null),
    [data],
  );

  useEffect(() => {
    if (!pageInfo || data?.page !== page) return;

    if (pageInfo.total === 0 && page > 1) {
      const href = createHref((nextParams) => nextParams.delete("page"));
      window.history.replaceState(null, "", href);
      return;
    }

    if (pageInfo.totalPages > 0 && page > pageInfo.totalPages) {
      const href = createHref((nextParams) =>
        nextParams.set("page", String(pageInfo.totalPages)),
      );
      window.history.replaceState(null, "", href);
    }
  }, [createHref, data?.page, page, pageInfo]);

  return {
    items: data?.items,
    pageInfo,
    isLoading,
    isValidating,
    error,
    mutate,
    page,
    q,
    sortState,
    params,
    setPage,
    setSearch,
    toggleSort,
    setParam,
  };
};

export { useOffsetList };
export type { OffsetListParamSpec, OffsetListParams, UseOffsetListOptions };
