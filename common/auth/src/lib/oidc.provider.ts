import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKey } from '@slamint/core';
import axios from 'axios';
import { Algorithm } from 'jsonwebtoken';

export const OIDC_CONFIG = Symbol('OIDC_CONFIG');

export interface OidcConfig {
  issuer: string;
  jwksUri: string;
  algorithms: Algorithm[];
  audience?: string;
}

export const OidcConfigProvider: Provider = {
  provide: OIDC_CONFIG,
  useFactory: async (cs: ConfigService): Promise<OidcConfig> => {
    const issuerUrl = cs.get<string>(ConfigKey.OIDC_ISSUER);
    if (!issuerUrl) throw new Error('OIDC_ISSUER is required');

    const { data: discovery } = await axios.get(
      `${issuerUrl}/.well-known/openid-configuration`
    );

    return {
      issuer: discovery.issuer,
      jwksUri:
        discovery.jwks_uri ??
        `${cs.get<string>(
          ConfigKey.OIDC_ISSUER
        )}/protocol/openid-connect/certs`,
      algorithms: discovery.id_token_signing_alg_values_supported ?? ['RS256'],
      audience: cs.get<string>(ConfigKey.OIDC_CLIENT) ?? undefined,
    };
  },
  inject: [ConfigService],
};
