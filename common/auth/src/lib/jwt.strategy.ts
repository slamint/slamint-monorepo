import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as jwksRsa from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { OIDC_CONFIG, type OidcConfig } from './oidc.provider';

import { ConfigKey } from '@slamint/core';
import { JwtUser, KcJwtPayload } from './keycloak';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  config: ConfigService;
  constructor(cs: ConfigService, @Inject(OIDC_CONFIG) oc: OidcConfig) {
    const aud = thisAudience(cs);
    const safe = {
      issuer: oc.issuer,
      jwksUri: oc.jwksUri,
      algorithms: oc.algorithms,
      audience: aud,
    };

    new Logger(JwtStrategy.name).log({ msg: 'OIDC config', ...safe });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: oc.issuer,
      audience: aud,
      algorithms: oc.algorithms,
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: oc.jwksUri,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        handleSigningKeyError: (err) => {
          new Logger(JwtStrategy.name).error({
            msg: 'JWKS signing key error',
            name: err?.name,
            message: err?.message,
          });
        },
      }),
      ignoreExpiration: false,
    });
    this.config = cs;
  }

  async validate(payload: KcJwtPayload): Promise<Partial<JwtUser>> {
    return payload;
  }
}

/* ---------- tiny helpers ---------- */
function thisAudience(cs: ConfigService): string | undefined {
  const aud = cs.get<string>(ConfigKey.OIDC_CLIENT);
  return aud && aud.trim() !== '' ? aud : undefined;
}
