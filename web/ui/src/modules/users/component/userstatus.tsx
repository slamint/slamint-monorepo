import { ShieldCheck, UserLock } from 'lucide-react';

export const UserStatus = ({ status }: { status: string }) =>
  status === 'active' ? (
    <ShieldCheck className='text-primary' />
  ) : (
    <UserLock className='text-destructive' />
  );
