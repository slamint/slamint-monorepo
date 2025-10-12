// modules/users/index.tsx
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  ServerQueryParams,
} from '@/components';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useGet } from '@/hooks/useGet';
import { RoleName } from '@/router/routes';
import { cn, Endpoints, formatDate } from '@/utils';
import { createColumnHelper } from '@tanstack/react-table';
import { UserRoundPlus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { UserRoleBadge } from './component/userrolebadge';
import { UserStatus } from './component/userstatus';

export interface UsersData {
  success: boolean;
  data: Data;
}
export interface Data {
  items: Item[];
  total: number;
  page: number;
  limit: number;
}
export interface Item {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: RoleName;
  department: Department;
  reportingManager: ReportingManager;
  status: string;
  createdAt: string;
  updatedAt: string;
  firstLoginAt: string;
  lastLoginAt: string;
}
export interface Department {
  id: string;
  code: string;
  name: string;
}
export interface ReportingManager {
  id: string;
  name: string;
  email: string;
}

const columnHelper = createColumnHelper<Item>();

export const Users = () => {
  // ---- table state that maps to API params
  const [serverParams, setServerParams] = useState<ServerQueryParams>({
    sort: 'createdAt',
    order: 'DESC',
    page: 1,
    limit: 20,
  });

  // ---- fetch with serverParams
  const {
    items: users,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useGet<Item>({
    endpoint: Endpoints.GETUSERS,
    params: serverParams,
  });

  const isLoading = status === 'pending';
  const hasData = users.length > 0;

  // ---- container sizing (unchanged)
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const heightAdjustRef = useRef<boolean>(false);

  useEffect(() => {
    if (tableWrapperRef?.current && !heightAdjustRef.current) {
      setContainerHeight(
        tableWrapperRef.current.getBoundingClientRect().height
      );
      heightAdjustRef.current = true;
    }
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'User',
        enableSorting: true,
        cell: (info) => {
          const { name, email } = info.row.original;
          return (
            <div className='flex items-center gap-3'>
              <Avatar className='h-8 w-8'>
                <AvatarFallback className='bg-gray-400 text-white uppercase'>
                  {name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className='flex-1 min-w-0 text-left'>
                <p className='text-sm font-medium truncate'>{name}</p>
                <p className='text-xs text-muted-foreground truncate'>
                  {email}
                </p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        enableSorting: true,
        cell: (info) => <UserRoleBadge role={info.getValue()} />,
      }),
      columnHelper.accessor('department', {
        header: 'Department',
        enableSorting: false,
        cell: (info) => info.getValue()?.name ?? '--',
      }),
      columnHelper.accessor('reportingManager', {
        header: 'Manager',
        enableSorting: false,
        cell: (info) => {
          const manager = info.getValue();
          return manager ? (
            <div className='flex-1 min-w-0 text-left'>
              <p className='text-sm font-medium truncate'>{manager?.name}</p>
              <p className='text-xs text-muted-foreground truncate'>
                {manager.email}
              </p>
            </div>
          ) : (
            '--'
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        enableSorting: true,
        cell: (info) => <UserStatus status={info.getValue()} />,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created On',
        enableSorting: true,
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    []
  );

  // ---- receive normalized params from DataTable (sorting/filters/global)
  const handleQueryChange = (p: ServerQueryParams) => {
    setServerParams((prev) => ({
      ...prev,
      // table-driven params
      sort: p.sort ?? prev.sort,
      order: p.order ?? prev.order,
      q: p.q,
      filters: p.filters,
      // IMPORTANT: reset pagination when sort/filters change
      page: 1,
      limit: prev.limit ?? 20,
    }));
  };

  // ---- when loading more, bump page for API (your useGet already handles fetchNextPage())
  const handleIntersectEnd = () => {
    if (hasNextPage && !isFetchingNextPage) {
      // Let your existing hook paginate; if you instead want serverParams.page++,
      // you can do this:
      // setServerParams((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }));
      fetchNextPage();
    }
  };

  return (
    <div className='flex flex-1 flex-col gap-4' ref={tableWrapperRef}>
      <Card className='flex-1 flex flex-col overflow-hidden'>
        <CardHeader>
          <div className='flex flex-col space-y-1.5'>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage team access and permissions
            </CardDescription>
          </div>
          <CardAction>
            <Button>
              <UserRoundPlus /> Add User
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent
          className='flex-1 flex flex-col overflow-hidden pt-1'
          style={{ maxHeight: containerHeight - 20 }}
        >
          <div className='flex gap-4  mb-4'>
            <Input
              placeholder='Search Users using name, username, email or phone'
              onChange={(e) => {
                const { value } = e.currentTarget;
                setTimeout(() => {
                  setServerParams({ ...serverParams, q: value });
                }, 500);
              }}
            />
          </div>
          {heightAdjustRef.current && (
            <DataTable<Item>
              data={users}
              columns={columns}
              className='z-0'
              initialSorting={
                serverParams.sort
                  ? [
                      {
                        id: serverParams.sort,
                        desc: (serverParams.order ?? 'DESC') === 'DESC',
                      },
                    ]
                  : [{ id: 'createdAt', desc: true }]
              }
              onQueryChange={handleQueryChange}
              isLoading={isLoading && !users.length}
              hasData={hasData}
              onIntersectEnd={handleIntersectEnd}
              canLoadMore={hasNextPage}
              isFetchingMore={isFetchingNextPage}
              tableBodyClassName={cn('flex-1 overflow-y-auto')}
            />
          )}

          {!heightAdjustRef.current && (
            <div className='flex w-full justify-center py-6'>
              <Badge variant='outline' className='gap-1'>
                <Spinner /> Preparing table
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
