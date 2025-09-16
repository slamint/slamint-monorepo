// api-gateway/src/app/auth/oidc.provider.ts
import * as client from 'openid-client';
import type { Algorithm } from 'jsonwebtoken';

export const OIDC_CONFIG = Symbol('OIDC_CONFIG');

export type OidcConfig = {
  issuer: string;
  jwksUri: string;
  algorithms: Algorithm[];
};

export const makeOidcConfig = async (
  issuerUrl: string
): Promise<OidcConfig> => {
  if (!issuerUrl) throw new Error('OIDC_ISSUER is required');

  const server = new URL(issuerUrl);
  const isLocalHttp =
    process.env.NODE_ENV !== 'production' &&
    server.protocol === 'http:' &&
    /^(localhost|127\.0\.0\.1)$/i.test(server.hostname);

  const config = await client.discovery(
    server,
    process.env.OIDC_CLIENT ?? '',
    // 3rd & 4th args are optional client metadata / client auth; keep them undefined here
    undefined,
    undefined,
    isLocalHttp ? { execute: [client.allowInsecureRequests] } : undefined
  );

  // (Alternative) If you prefer, you can apply it after discovery:
  // if (isLocalHttp) client.allowInsecureRequests(config);

  const metadata = config.serverMetadata();

  return {
    issuer: metadata.issuer ?? '',
    jwksUri: metadata.jwks_uri ?? '',
    algorithms: (metadata.id_token_signing_alg_values_supported ?? [
      'RS256',
    ]) as Algorithm[],
  };
};
