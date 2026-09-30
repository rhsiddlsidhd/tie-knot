"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";

import type { ErrorPayload } from "@/core/domain/error";
import type { OffsetPage, OffsetPageInfo } from "@/core/domain/offset";
import type {
  OffsetListParams,
  OffsetListParamSpec,
} from "@/core/utils/offset-list-query";
import {
  buildOffsetListKey,
  parseOffsetListQuery,
} from "@/core/utils/offset-list-query";
import { getNextSortState } from "@/core/utils/sort-cycle";
import { fetcher } from "@/ui/fetcher";

interface UseOffsetListOptions<
  S extends string,
  P extends OffsetListParamSpec,
> {
  endpoint: string;
  sortKeys: readonly S[];
  params: P;
}

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
  const queryState = parseOffsetListQuery(searchParams, {
    sortKeys,
    params: paramSpec,
  });
  const { page, q, sortState, params, namesToRemove } = queryState;

  // 기본값이나 허용되지 않은 값은 SWR key에서 정규화한다.
  // URL은 다음 조작 때 함께 정리한다.
  const cleanupKey = namesToRemove.join("\0");
  const key = buildOffsetListKey(endpoint, queryState);

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    OffsetPage<T>,
    ErrorPayload
  >(key, fetcher, { keepPreviousData: true });

  const createHref = useCallback(
    (update: (nextParams: URLSearchParams) => void) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (cleanupKey) {
        cleanupKey.split("\0").forEach((name) => nextParams.delete(name));
      }
      update(nextParams);
      const query = nextParams.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [cleanupKey, pathname, searchParams],
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
