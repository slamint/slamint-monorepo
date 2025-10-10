import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app';

import { Provider } from 'react-redux';
import { AuthProvider } from './lib/auth/authprovider';
import { initKeycloak } from './lib/auth/keycloak';
import { store } from './redux/store';
import './styles.scss';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

await initKeycloak();

root.render(
  <StrictMode>
    <AuthProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </AuthProvider>
  </StrictMode>
);
