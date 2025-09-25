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
  azp?: string; // authorized party / current client
  clientId?: string; // sometimes used by adapters
}

export function extractRoles(
  p: KcJwtPayload,
  includeClients?: string[]
): string[] {
  const ignore = new Set([
    'offline_access',
    'uma_authorization',
    'default-roles-slamint',
    'manage-account',
    'manage-account-links',
    'view-profile',
  ]);
  const realm = (u.realm_access?.roles ?? []).map((r) => r.toLowerCase());
  const clientId = (u as any).azp ?? (u as any).clientId;
  const client = clientId
    ? (u.resource_access?.[clientId]?.roles ?? []).map((r) => r.toLowerCase())
    : [];
  return Array.from(new Set([...realm, ...client])).filter(
    (r) => !ignore.has(r)
  );
}

export interface JwtUser extends KcJwtPayload {
  roles: string[];
  email_verified?: boolean;
  priorityRole?: string;
}

export interface KCRealmRole {
  id: string;
  name: string;
  description?: string;
  composite: boolean;
  clientRole: boolean;
  containerId: string;
}

export interface KCUserAccess {
  manageGroupMembership: boolean;
  view: boolean;
  mapRoles: boolean;
  impersonate: boolean;
  manage: boolean;
}

export interface KCUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  createdTimestamp: number;
  enabled: boolean;
  totp: boolean;
  disableableCredentialTypes: string[];
  requiredActions: string[];
  notBefore: number;
  access: KCUserAccess;
}
