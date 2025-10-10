import { Avatar, AvatarFallback, Button } from '@/components';
import { ButtonSize, ButtonVariant } from '@/components/ui/button';
import { useState } from 'react';

import { cn } from '@/utils';
import { ChevronLeft, ChevronRight, Home, Ticket, Users } from 'lucide-react';

const menuItems = [
  { icon: <Home />, label: 'Dashboard' },
  { icon: <Ticket />, label: 'Ticket' },
  { icon: <Users />, label: 'Users' },
];

export const SideBar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`bg-card border-r border-border flex flex-col overflow-hidden transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className='p-4 border-b border-border flex items-center justify-between'>
        {!isCollapsed && (
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
              <span className='text-primary-foreground font-semibold'>S</span>
            </div>
            <span className='font-semibold'>SLAMint</span>
          </div>
        )}
        <Button
          variant={ButtonVariant.GHOST}
          size={ButtonSize.SM}
          onClick={() => setIsCollapsed(!isCollapsed)}
          {...(isCollapsed ? { className: 'w-full' } : {})}
        >
          {isCollapsed ? (
            <ChevronRight className='h-4 w-4' />
          ) : (
            <ChevronLeft className='h-4 w-4' />
          )}
        </Button>
      </div>
      <nav className='flex-1 p-4 space-y-2 w-full'>
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant={ButtonVariant.GHOST}
            size={ButtonSize.DEFAULT}
            className={cn('w-full justify-start', {
              'justify-center': isCollapsed,
            })}
          >
            {item.icon} {!isCollapsed && item.label}
          </Button>
        ))}
      </nav>
      <div className='p-4 border-t border-sidebar-border'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium truncate'>Admin User</p>
              <p className='text-xs text-muted-foreground truncate'>
                admin@example.com
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
