// components/datatable.tsx
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/utils';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDownAZ, ArrowDownUp, ArrowDownZA, UsersIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type ServerQueryParams = {
  /** column id used for sorting */
  sort?: string;
  /** 'ASC' | 'DESC' */
  order?: 'ASC' | 'DESC';
  /** free-text global search (optional) */
  q?: string;
  /**
   * per-column filters, e.g. [{ id: 'status', value: 'ACTIVE' }]
   * value can be string | number | string[] depending on your backend
   */
  filters?: Array<{ id: string; value: unknown }>;
  /** for pagination/infinite scroll */
  page?: number;
  limit?: number;
};

type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  /** initial server-driven state (useful for SSR or restoring from URL) */
  initialSorting?: SortingState;
  initialColumnFilters?: ColumnFiltersState;
  /** if you support a global search bar */
  initialGlobalFilter?: string;

  /** called whenever sorting/filters/globalFilter changes */
  onQueryChange?: (params: ServerQueryParams) => void;

  /** visual opts */
  className?: string;
  tableBodyClassName?: string;

  /** loading & empty states */
  isLoading?: boolean;
  hasData?: boolean;

  /** infinite scroll */
  onIntersectEnd?: () => void;
  canLoadMore?: boolean;
  isFetchingMore?: boolean;
};

export function DataTable<TData>({
  data,
  columns,
  initialSorting,
  initialColumnFilters,
  initialGlobalFilter,
  onQueryChange,
  className,
  tableBodyClassName,
  isLoading,
  hasData = data.length > 0,
  onIntersectEnd,
  canLoadMore,
  isFetchingMore,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialColumnFilters ?? []
  );
  const [globalFilter, setGlobalFilter] = useState<string>(
    initialGlobalFilter ?? ''
  );
  const onQueryChangeRef = useRef<typeof onQueryChange>(onQueryChange);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    // IMPORTANT: server-driven
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
  });

  // Normalize & emit params for the API
  const params = useMemo<ServerQueryParams>(() => {
    const firstSort = sorting[0];
    const normalized: ServerQueryParams = {
      sort: firstSort?.id,
      order: firstSort ? (firstSort.desc ? 'DESC' : 'ASC') : undefined,
      q: globalFilter || undefined,
      filters:
        columnFilters.length > 0
          ? columnFilters.map((f) => ({ id: f.id, value: f.value }))
          : undefined,
    };
    return normalized;
  }, [sorting, columnFilters, globalFilter]);

  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  }, [onQueryChange]);

  useEffect(() => {
    onQueryChangeRef.current?.(params);
  }, [params]);

  const endRef = useRef<HTMLDivElement | null>(null);

  const onIntersectEndRef = useRef<typeof onIntersectEnd>(onIntersectEnd);
  useEffect(() => {
    onIntersectEndRef.current = onIntersectEnd;
  }, [onIntersectEnd]);

  const canLoadMoreRef = useRef<boolean | undefined>(canLoadMore);
  useEffect(() => {
    canLoadMoreRef.current = canLoadMore;
  }, [canLoadMore]);

  const isFetchingMoreRef = useRef<boolean | undefined>(isFetchingMore);
  useEffect(() => {
    isFetchingMoreRef.current = isFetchingMore;
  }, [isFetchingMore]);

  useEffect(() => {
    if (!endRef.current) return;

    const el = endRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          canLoadMoreRef.current &&
          !isFetchingMoreRef.current
        ) {
          // call the latest callback safely
          onIntersectEndRef.current?.();
        }
      },
      {
        root: null, // viewport
        threshold: 0.1, // a little visible is enough
        rootMargin: '0px 0px 200px 0px', // prefetch slightly before bottom
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // create once

  return (
    <div className={cn('flex-1 flex flex-col overflow-hidden', className)}>
      {/* If you later add a global search input, bind to setGlobalFilter */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        <Table
          containerClassName={cn('flex-1 overflow-y-auto', tableBodyClassName)}
        >
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    <div className='flex justify-between items-center'>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getCanSort() && (
                        <Button
                          variant={ButtonVariant.GHOST}
                          size={ButtonSize.ICON}
                          className='hover:bg-transparent hover:text-primary'
                          onClick={() =>
                            header.column.toggleSorting(
                              header.column.getIsSorted() === 'asc'
                            )
                          }
                          aria-label={`Sort by ${String(header.column.id)}`}
                        >
                          {!header.column.getIsSorted() && (
                            <ArrowDownUp className='stroke-slate-200' />
                          )}
                          {header.column.getIsSorted() === 'asc' && (
                            <ArrowDownAZ />
                          )}
                          {header.column.getIsSorted() === 'desc' && (
                            <ArrowDownZA />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className='flex w-full justify-center py-6'>
                    <Badge variant='outline' className='gap-1'>
                      <Spinner /> Loading
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!isLoading && table.getRowModel().rows?.length > 0
              ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {/* Empty state */}
            {!isLoading && !hasData && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className='p-0'>
                    <div className='border-none'>
                      <Empty className='border-none'>
                        <EmptyHeader>
                          <EmptyMedia variant='icon'>
                            <UsersIcon />
                          </EmptyMedia>
                          <EmptyTitle>No Data</EmptyTitle>
                          <EmptyDescription>
                            Try adjusting filters
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* infinite scroll sentinel */}
            <tr>
              <td colSpan={columns.length}>
                <div ref={endRef} className='h-px w-full' />
              </td>
            </tr>
          </TableBody>
        </Table>
      </div>

      {/* Fetch-more footer indicator */}
      {isFetchingMore && (
        <div className='flex w-full justify-center py-3'>
          <Badge variant='outline' className='gap-1'>
            <Spinner /> Loading
          </Badge>
        </div>
      )}
    </div>
  );
}
