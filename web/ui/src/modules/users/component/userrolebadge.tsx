import { Badge } from '@/components/ui/badge';
import { RoleName } from '@/router/routes';
import { ShieldUser, User, UserCog, UserStar } from 'lucide-react';

export const UserRoleBadge = ({ role }: { role: RoleName }) => {
  switch (role) {
    case RoleName.admin:
      return (
        <Badge
          variant='outline'
          className='capitalize bg-destructive text-white inline-flex gap-1 w-auto'
        >
          <ShieldUser className='h-4 w-4' /> {RoleName.admin}
        </Badge>
      );
    case RoleName.manager:
      return (
        <Badge
          variant='outline'
          className='capitalize bg-primary  text-white inline-flex gap-1 w-auto'
        >
          <UserStar className='h-4 w-4' /> {RoleName.manager}
        </Badge>
      );
    case RoleName.engineer:
      return (
        <Badge
          variant='outline'
          className='capitalize bg-accent  text-white inline-flex gap-1 w-auto'
        >
          <UserCog className='h-4 w-4' /> {RoleName.engineer}
        </Badge>
      );
    default:
      return (
        <Badge
          variant='outline'
          className='capitalize bg-primary-foreground text-white inline-flex gap-1 w-auto'
        >
          <User className='h-4 w-4' /> {RoleName.user}
        </Badge>
      );
  }
};
