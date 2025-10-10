import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { useApiClient } from './hooks';
import { useAuth } from './lib/auth/authprovider';
import { Profile, setProfileData } from './redux/slices/account-slice';
import { AppRouter } from './router/approuter';
import { Endpoints } from './utils';

const queryClient = new QueryClient();

export function App() {
  const { authenticated } = useAuth();
  const dispatch = useDispatch();
  const api = useApiClient();

  useEffect(() => {
    if (authenticated) {
      api.get(Endpoints.GETME).then((res) => {
        console.log(res.data.data);
        dispatch(setProfileData(res.data.data as unknown as Profile));
      });
    }
  }, [authenticated]);
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={AppRouter} />
    </QueryClientProvider>
  );
}

export default App;
