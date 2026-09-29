"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";

import type { ErrorPayload } from "@/core/domain/error";
import type { OffsetPage } from "@/core/domain/offset";
import type { SortDirection } from "@/core/utils/sort-cycle";
import { getNextSortState } from "@/core/utils/sort-cycle";
import { fetcher } from "@/ui/fetcher";

interface UseOffsetListOptions<P extends string> {
  endpoint: string;
  params?: readonly P[];
}

const getPage = (value: string | null): number => {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
};

const useOffsetList = <T, S extends string, P extends string = string>({
  endpoint,
  params: paramNames = [],
}: UseOffsetListOptions<P>) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = getPage(searchParams.get("page"));
  const q = searchParams.get("q")?.trim() ?? "";
  const sortValue = searchParams.get("sort")?.trim();
  const sort = (sortValue || undefined) as S | undefined;
  const directionValue = searchParams.get("direction");
  const direction: SortDirection | undefined = sort
    ? directionValue === "asc"
      ? "asc"
      : "desc"
    : undefined;
  const params = Object.fromEntries(
    paramNames.map((name) => {
      const value = searchParams.get(name)?.trim();
      return [name, value || undefined];
    }),
  ) as Record<P, string | undefined>;

  const keyParams = new URLSearchParams();
  keyParams.set("page", String(page));
  if (q) keyParams.set("q", q);
  if (sort) keyParams.set("sort", sort);
  if (direction) keyParams.set("direction", direction);
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
      update(nextParams);
      const query = nextParams.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams],
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
      const nextState = getNextSortState(sort, direction, nextSort);
      const href = createHref((nextParams) => {
        nextParams.delete("page");
        if (nextState.sort && nextState.direction) {
          nextParams.set("sort", nextState.sort);
          nextParams.set("direction", nextState.direction);
        } else {
          nextParams.delete("sort");
          nextParams.delete("direction");
        }
      });
      window.history.replaceState(null, "", href);
    },
    [createHref, direction, sort],
  );

  const setParam = useCallback(
    (name: P, value?: string) => {
      const href = createHref((nextParams) => {
        nextParams.delete("page");
        if (value) nextParams.set(name, value);
        else nextParams.delete(name);
      });
      window.history.replaceState(null, "", href);
    },
    [createHref],
  );

  useEffect(() => {
    if (!data || data.page !== page) return;

    if (data.total === 0 && page > 1) {
      const href = createHref((nextParams) => nextParams.delete("page"));
      window.history.replaceState(null, "", href);
      return;
    }

    if (data.totalPages > 0 && page > data.totalPages) {
      const href = createHref((nextParams) =>
        nextParams.set("page", String(data.totalPages)),
      );
      window.history.replaceState(null, "", href);
    }
  }, [createHref, data, page]);

  return {
    items: data?.items,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    isValidating,
    error,
    mutate,
    page,
    q,
    sort,
    direction,
    params,
    setPage,
    setSearch,
    toggleSort,
    setParam,
  };
};

export { useOffsetList };
export type { UseOffsetListOptions };
