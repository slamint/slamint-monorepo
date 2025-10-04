import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKey } from '@slamint/core';
import axios from 'axios';
import type { Algorithm } from 'jsonwebtoken';

export const OIDC_CONFIG = Symbol('OIDC_CONFIG');

export interface OidcConfig {
  issuer: string;
  jwksUri: string;
  algorithms: Algorithm[];
  audience?: string;
}

function trimSlash(s: string | undefined | null): string | undefined {
  if (!s) return s as undefined;
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

export const OidcConfigProvider: Provider = {
  provide: OIDC_CONFIG,
  useFactory: async (cs: ConfigService): Promise<OidcConfig> => {
    const issuerUrlRaw = cs.get<string>(ConfigKey.OIDC_ISSUER);
    if (!issuerUrlRaw) throw new Error('OIDC_ISSUER is required');

    const issuerUrl = trimSlash(issuerUrlRaw)!;

    // Always discover from the public issuer (matches token `iss`)
    const { data: discovery } = await axios.get(
      `${issuerUrl}/.well-known/openid-configuration`
    );

    // Prefer explicit internal JWKS if provided; else use discovery
    const jwksEnv = trimSlash(cs.get<string>(ConfigKey.OIDC_JWKS_URI));
    const jwksUri = jwksEnv ?? discovery.jwks_uri;

    // Keep algorithms tight (default Keycloak is RS256)
    const algs: Algorithm[] = (
      discovery.id_token_signing_alg_values_supported as Algorithm[]
    )?.includes('RS256' as Algorithm)
      ? (['RS256'] as Algorithm[])
      : (['RS256'] as Algorithm[]);

    const audience = cs.get<string>(ConfigKey.OIDC_CLIENT) || undefined;

    return {
      issuer: discovery.issuer, // must equal token `iss` exactly (public HTTPS)
      jwksUri, // internal HTTP allowed here
      algorithms: algs,
      audience,
    };
  },
  inject: [ConfigService],
};
