import { RoleName } from '@slamint/core';
import { JwtUser, KcJwtPayload } from './keycloak';

const IGNORED = new Set<string>([
  'offline_access',
  'uma_authorization',
  'default-roles-slamint',
  'manage-account',
  'manage-account-links',
  'view-profile',
]);

export const ROLE_PRIORITY: Readonly<RoleName[]> = [
  RoleName.admin,
  RoleName.manager,
  RoleName.engineer,
  RoleName.user,
];

// type guard to keep only RoleName values
export function isRoleName(v: string): v is RoleName {
  return (
    v === RoleName.admin ||
    v === RoleName.manager ||
    v === RoleName.engineer ||
    v === RoleName.user
  );
}

export function extractRoles(
  p: KcJwtPayload,
  includeClients?: readonly string[]
): RoleName[] {
  const norm = (arr: readonly string[] | undefined): RoleName[] =>
    (arr ?? [])
      .map((r) => r.toLowerCase())
      .filter((r) => !IGNORED.has(r))
      .filter(isRoleName);

  const realmRoles = norm(p.realm_access?.roles);

  const selectedClients: readonly string[] =
    includeClients && includeClients.length > 0
      ? includeClients
      : [p.azp ?? p.clientId ?? ''].filter(Boolean);

  const resourceRoles: RoleName[] = [];
  for (const cid of selectedClients) {
    const entry = p.resource_access?.[cid];
    if (entry?.roles) resourceRoles.push(...norm(entry.roles));
  }

  const uniq = Array.from(new Set<RoleName>([...realmRoles, ...resourceRoles]));
  return uniq.length ? uniq : [RoleName.user];
}

export function collectUserRoles(user: JwtUser): ReadonlySet<RoleName> {
  const out = new Set<RoleName>();

  const addRaw = (r?: string) => {
    if (!r) return;
    const lc = r.toLowerCase();
    if (isRoleName(lc)) out.add(lc);
  };

  // 1) your mapped array
  (user.roles ?? []).forEach(addRaw);

  // 2) realm roles
  (user.realm_access?.roles ?? []).forEach(addRaw);

  // 3) resource roles across clients
  const ra = user.resource_access;
  if (ra) {
    Object.values(ra).forEach((entry) => {
      (entry.roles ?? []).forEach(addRaw);
    });
  }

  return out;
}
