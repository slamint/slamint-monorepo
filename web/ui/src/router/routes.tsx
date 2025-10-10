import { Dashboard, Users } from '@/modules';

import { RoutePaths } from './routePaths';

export enum RoleName {
  admin = 'admin',
  user = 'user',
  manager = 'manager',
  engineer = 'engineer',
}

export interface RouteItem {
  path: string;
  element: React.ReactNode;
  authRequired?: boolean;
  roles?: RoleName[];
}

export const restrictedRoutes: RouteItem[] = [
  {
    path: RoutePaths.DASHBOARD,
    element: <Dashboard />,
    authRequired: true,
    roles: [RoleName.manager, RoleName.admin],
  },
  {
    path: RoutePaths.USERS,
    element: <Users />,
    authRequired: true,
    roles: [RoleName.manager, RoleName.admin],
  },
];
