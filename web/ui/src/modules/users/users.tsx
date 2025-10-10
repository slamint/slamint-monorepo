import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { useGet } from '@/hooks/useGet';
import { RoleName } from '@/router/routes';
import { cn, Endpoints, formatDate } from '@/utils';
import { UserRoundPlus, UsersIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { UserRoleBadge } from './component/userRoleBadge';
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

export const Users = () => {
  const limit = 20;
  const {
    items: users,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    total,
    pageCount,
  } = useGet<Item>({
    endpoint: Endpoints.GETUSERS,
    params: { limit },
  });

  console.log({
    users,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    total,
    pageCount,
  });
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const heightAdjustRef = useRef<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (tableWrapperRef?.current && !heightAdjustRef.current) {
      setContainerHeight(
        tableWrapperRef.current.getBoundingClientRect().height
      );
      heightAdjustRef.current = true;
    }
  }, [heightAdjustRef, setContainerHeight, tableWrapperRef]);

  useEffect(() => {
    if (!loadMoreRef.current || status === 'pending') return;
    const el = loadMoreRef.current;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, status]);

  return (
    <div className='flex flex-1 flex-col gap-4' ref={tableWrapperRef}>
      <div className='flex gap-3 justify-end'>
        <Button>
          <UserRoundPlus /> Add User
        </Button>
      </div>
      <Card className='flex-1 flex flex-col overflow-hidden'>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage team access and permissions</CardDescription>
        </CardHeader>
        <CardContent
          className='flex-1 flex flex-col overflow-hidden'
          style={{
            maxHeight: containerHeight - 200,
          }}
        >
          {heightAdjustRef.current && (
            <>
              {users.length > 0 ? (
                <Table containerClassName={cn('flex-1 overflow-y-auto')}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className='cursor-pointer'>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-8 w-8'>
                              <AvatarFallback className='bg-gray-400 text-white uppercase'>
                                {user?.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>

                            <div className='flex-1 min-w-0 text-left'>
                              <p className='text-sm font-medium truncate'>
                                {user?.name}
                              </p>
                              <p className='text-xs text-muted-foreground truncate'>
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserRoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>{user.department?.name ?? '--'}</TableCell>
                        <TableCell>
                          {user.reportingManager ? (
                            <div className='flex-1 min-w-0 text-left'>
                              <p className='text-sm font-medium truncate'>
                                {user?.reportingManager?.name}
                              </p>
                              <p className='text-xs text-muted-foreground truncate'>
                                {user?.reportingManager?.email}
                              </p>
                            </div>
                          ) : (
                            '--'
                          )}
                        </TableCell>
                        <TableCell>
                          <UserStatus status={user.status} />
                        </TableCell>
                        <TableCell>{formatDate(user?.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    <div ref={loadMoreRef} className='h-px w-full' />
                  </TableBody>
                </Table>
              ) : (
                <Empty className='border-none'>
                  <EmptyHeader>
                    <EmptyMedia variant='icon'>
                      <UsersIcon />
                    </EmptyMedia>
                    <EmptyTitle>No User Found</EmptyTitle>
                    <EmptyDescription>
                      Try adjusting filters or create a new user
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button>
                      <UserRoundPlus /> Add User
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          {isFetchingNextPage && (
            <div className='flex w-full justify-center'>
              <Badge variant='outline' className='gap-1'>
                <Spinner />
                Loading
              </Badge>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
