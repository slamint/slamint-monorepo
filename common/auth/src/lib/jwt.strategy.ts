import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { OIDC_CONFIG, type OidcConfig } from './oidc.provider';

type ResourceAccessEntry = { roles?: string[] };
type ResourceAccess = Record<string, ResourceAccessEntry>;
interface TokenPayload {
  sub?: string;
  email?: string;
  name?: string;
  roles?: string[];
  realm_access?: { roles?: string[] };
  resource_access?: ResourceAccess;
  [k: string]: unknown;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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
  }

  async validate(payload: TokenPayload) {
    const resourceRoles = flattenResourceRoles(payload.resource_access);
    const realmRoles = payload.realm_access?.roles ?? [];
    const directRoles = payload.roles ?? [];
    const roles = Array.from(
      new Set([...directRoles, ...resourceRoles, ...realmRoles])
    );

    return {
      sub: payload.sub ?? '',
      email: payload.email ?? '',
      name: payload.name ?? '',
      roles,
      raw: payload,
    };
  }
}

/* ---------- tiny helpers ---------- */
function thisAudience(cs: ConfigService): string | undefined {
  const aud = cs.get<string>('OIDC_CLIENT');
  return aud && aud.trim() !== '' ? aud : undefined;
}

function flattenResourceRoles(resource?: ResourceAccess): string[] {
  if (!resource) return [];
  const all: string[] = [];
  for (const key of Object.keys(resource)) {
    const roles = resource[key]?.roles ?? [];
    for (const r of roles) all.push(r);
  }
  return all;
}
