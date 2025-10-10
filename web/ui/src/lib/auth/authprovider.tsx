import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { keycloak } from './keycloak';

type AuthContextType = {
  initialized: boolean;
  authenticated: boolean;
  token?: string;
  profile?: Keycloak.KeycloakProfile | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log({
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_KEYCLOAK_REALM,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  });
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<Keycloak.KeycloakProfile | null>(null);

  useEffect(() => {
    let refreshTimer: number | undefined;

    async function run() {
      try {
        const isAuth = !!keycloak.authenticated;
        setAuthenticated(isAuth);
        if (isAuth) {
          // optional: load profile
          try {
            const p = await keycloak.loadUserProfile();
            setProfile(p);
          } catch {
            /* ignore */
          }

          // token refresh loop: refresh when < 60s remaining
          const schedule = async () => {
            try {
              await keycloak.updateToken(60);
            } catch {
              // if refresh fails (e.g., session expired), force re-login if you want:
              // keycloak.login();
            } finally {
              const exp = keycloak.tokenParsed?.exp
                ? keycloak.tokenParsed.exp * 1000
                : Date.now() + 60000;
              const delay = Math.max(10000, exp - Date.now() - 45000); // refresh ~45s before expiry
              refreshTimer = window.setTimeout(
                schedule,
                delay
              ) as unknown as number;
            }
          };
          schedule();
        }
      } finally {
        setInitialized(true);
      }
    }

    run();

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      initialized,
      authenticated,
      token: keycloak.token ?? undefined,
      profile,
      login: () => keycloak.login({ redirectUri: window.location.href }),
      logout: () => keycloak.logout({ redirectUri: window.location.origin }),
      hasRole: (role: string) => {
        const realmRoles = keycloak?.realmAccess?.roles ?? [];
        const clientRoles = Object.values(
          keycloak.resourceAccess ?? {}
        ).flatMap((r) => r?.roles ?? []);
        return realmRoles.includes(role) || clientRoles.includes(role);
      },
    }),
    [initialized, authenticated, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
