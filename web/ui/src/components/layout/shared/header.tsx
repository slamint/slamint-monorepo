import Logo from '@/assets/svg/logo.svg';
import { Avatar, AvatarFallback } from '@/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/authprovider';
import { RootState } from '@/redux/store';
import { RoutePaths } from '@/router/routePaths';
import { cn, formatDate } from '@/utils';
import { Home, LogOut, Ticket, User, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { RouteBreadcrumb } from './routeBreadcrumb';

const menuItems = [
  { icon: <Home />, label: 'Dashboard', link: RoutePaths.DASHBOARD },
  { icon: <Ticket />, label: 'Ticket', link: RoutePaths.TICKET },
  { icon: <Users />, label: 'Users', link: RoutePaths.USERS },
];

export const Header = () => {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { profile } = useSelector((state: RootState) => state.account);
  return (
    <>
      <header className='h-16 bg-header border-b border-border flex items-center px-6'>
        <div className='flex items-center gap-2'>
          <img src={Logo} />
        </div>
        <nav className='flex-1 flex px-6 h-full items-center gap-6'>
          {menuItems.map((item) => (
            <Link
              to={item.link}
              key={item.label}
              className={cn(
                'inline-flex gap-2 w-auto h-full items-center text-sm',
                {
                  'border-0 border-b-2 border-primary': pathname.includes(
                    item.link
                  ),
                }
              )}
            >
              <span className='text-sm'>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger className='focus-visible:outline-none'>
            <div className='flex items-center gap-3'>
              <Avatar className='h-8 w-8'>
                <AvatarFallback className='bg-primary text-white uppercase'>
                  {profile?.name?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className='flex-1 min-w-0 text-left'>
                <p className='text-sm font-medium truncate'>{profile?.name}</p>
                <p className='text-xs text-muted-foreground truncate'>
                  {profile?.email}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <User /> My Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut />
              Logout
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='flex flex-col text-left gap-1 text-xs items-start hover:bg-transparent focus:bg-transparent cursor-default text-gray-500'>
              <span className='font-medium'>Last Login</span>
              <span>{formatDate(profile?.lastLoginAt as string)}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className='px-6 py-4'>
        <RouteBreadcrumb />
      </div>
    </>
  );
};
