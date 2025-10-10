// useGet.ts
import { QueryKey, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useApiClient } from './useApiClient';

type PageMeta = {
  items: unknown[]; // will be generic below
  total: number;
  page: number;
  limit: number;
};

export type ApiListEnvelope<TItem> = {
  success: boolean;
  data: {
    items: TItem[];
    total: number;
    page: number;
    limit: number;
  };
};

type Params = Record<string, any>;

interface UseGetProps<TItem> {
  endpoint: string; // e.g. '/users'
  params?: Params; // e.g. { search: 'john', limit: 20 }
  enabled?: boolean; // default true
  queryKey?: QueryKey; // optional custom key
  pageParamKey?: string; // default 'page' if your API uses a different key
  limitParamKey?: string; // default 'limit' if your API uses a different key
}

export function useGet<TItem = unknown>({
  endpoint,
  params,
  enabled = true,
  queryKey,
  pageParamKey = 'page',
  limitParamKey = 'limit',
}: UseGetProps<TItem>) {
  const apiClient = useApiClient();

  const key = useMemo<QueryKey>(
    () => queryKey ?? ['infinite', endpoint, params ?? {}],
    [queryKey, endpoint, params]
  );

  const query = useInfiniteQuery<ApiListEnvelope<TItem>>({
    queryKey: key,
    enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const qp: Params = { ...(params ?? {}) };

      // If caller passed a fixed limit in params, keep it. Otherwise preserve whatever backend defaults to.
      if (pageParam != null) qp[pageParamKey] = pageParam;

      const res = await apiClient.get(endpoint, { params: qp });
      return res.data as ApiListEnvelope<TItem>;
    },
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.data;
      const reached = page * limit >= total;
      return reached ? undefined : page + 1;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const items = useMemo<TItem[]>(
    () => (query.data?.pages ?? []).flatMap((p) => p.data.items),
    [query.data]
  );

  // Useful derived meta from the latest page (falls back to first)
  const meta = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const last = pages[pages.length - 1]?.data;
    const first = pages[0]?.data;
    return (
      last ??
      first ?? {
        items: [],
        total: 0,
        page: 1,
        limit: (params?.[limitParamKey] as number) ?? 20,
      }
    );
  }, [query.data, params, limitParamKey]);

  const total = meta.total;
  const page = meta.page;
  const limit = meta.limit;
  const pageCount = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    ...query,
    items, // flattened items across pages
    total,
    page,
    limit,
    pageCount,
  };
}
