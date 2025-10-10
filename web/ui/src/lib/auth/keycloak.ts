import Keycloak, { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';

const config: KeycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

export const keycloak = new Keycloak(config);

export async function initKeycloak() {
  const options: KeycloakInitOptions = {
    pkceMethod: 'S256',
    onLoad: 'login-required',
    checkLoginIframe: false,
    flow: 'standard',
  };

  const authenticated = await keycloak.init(options);
  return authenticated;
}
