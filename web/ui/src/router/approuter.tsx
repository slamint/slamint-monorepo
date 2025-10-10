import { MainLayout } from '@/components';
import { useAuth } from '@/lib/auth/authprovider';
import { useEffect } from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RoutePaths } from './routePaths';
import { restrictedRoutes, RouteItem } from './routes';

export const RestrictedRouteWrapper = (route: RouteItem) => {
  const { initialized, authenticated, login } = useAuth();

  useEffect(() => {
    if (initialized && !authenticated) login();
  }, [initialized, authenticated, login]);

  if (!initialized) return <div>Loading…</div>;
  if (!authenticated) return null; // just triggered login  // TODO : Add auth and role based access control here
  return <MainLayout>{route.element}</MainLayout>;
};

const restrictedRouteObjects: RouteObject[] = restrictedRoutes.map((route) => ({
  path: route.path,
  element: <RestrictedRouteWrapper {...route} />,
}));

export const AppRouter: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    {
      path: '/',
      element: <Navigate to={RoutePaths.DASHBOARD} replace />,
    },
    ...restrictedRouteObjects,
  ]);
