export interface KcRealmAccess {
  roles: string[];
}
export interface KcResourceAccess {
  [clientId: string]: { roles: string[] };
}
export interface KcJwtPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  realm_access?: KcRealmAccess;
  resource_access?: KcResourceAccess;
  name?: string;
  iss: string;
  aud?: string | string[];
}

export function extractRoles(
  p: KcJwtPayload,
  includeClients?: string[]
): string[] {
  const realm = p.realm_access?.roles ?? [];
  const clientIds = includeClients ?? Object.keys(p.resource_access ?? {});
  const client = clientIds.flatMap(
    (cid) => p.resource_access?.[cid]?.roles ?? []
  );
  return Array.from(new Set([...realm, ...client])).map((r) => r.toLowerCase());
}

export interface JwtUser {
  sub: string;
  email: string;
  roles: string[];
  iss?: string;
  preferred_username?: string;
  name?: string;
  email_verified?: boolean;
  realm_access?: { roles?: string[] };
}
