import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { OIDC_CONFIG, type OidcConfig } from './oidc.provider';

import { JwtUser, KcJwtPayload } from './keycloak';
import { ConfigKey } from '@slamint/core';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  config: ConfigService;
  constructor(cs: ConfigService, @Inject(OIDC_CONFIG) oc: OidcConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: oc.issuer,
      audience: thisAudience(cs),
      algorithms: oc.algorithms,
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: oc.jwksUri,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
      ignoreExpiration: false,
    });
    this.config = cs;
  }

  async validate(payload: KcJwtPayload): Promise<JwtUser> {
    const realmRoles = payload.realm_access?.roles ?? [];
    const directRoles =
      payload.resource_access?.[thisAudience(this.config) ?? '']?.roles ?? [];
    const roles = Array.from(new Set([...directRoles, ...realmRoles]));

    return {
      sub: payload.sub ?? '',
      email: payload.email ?? '',
      preferred_username: payload.preferred_username ?? '',
      name: payload.name,
      roles,
    };
  }
}

/* ---------- tiny helpers ---------- */
function thisAudience(cs: ConfigService): string | undefined {
  const aud = cs.get<string>(ConfigKey.OIDC_CLIENT);
  return aud && aud.trim() !== '' ? aud : undefined;
}
