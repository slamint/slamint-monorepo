import { FC, PropsWithChildren } from 'react';
import { Header } from '../shared/header';

export const MainLayout: FC<PropsWithChildren> = ({ children }) => (
  <div className='flex flex-col h-screen bg-background'>
    <Header />
    <div className='flex-1 flex flex-col overflow-hidden px-6 pb-6'>
      {children}
    </div>
  </div>
);
