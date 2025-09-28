import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  Method,
} from 'axios';
import type { Cache } from 'cache-manager';
import http from 'http';
import https from 'https';

import type { KCRealmRole, KCUser } from '@slamint/auth';
import type { InviteUser, LoggerLike } from '@slamint/core';
import {
  AccountManagementErrCodes,
  AccountManagementErrMessage,
  ConfigKey,
  getRequestContext,
  LOGGER,
  RoleName,
  RPCCode,
  rpcErr,
  serverError,
  ServerErrorMessage,
} from '@slamint/core';

const REALM_ROLES = new Set(Object.values(RoleName));

function isTransientNetErr(err: any) {
  const code = err?.code;
  return (
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED'
  );
}

@Injectable()
export class KeycloakService {
  private readonly http: AxiosInstance;
  private inflight = new Map<string, Promise<any>>();
  private readonly ROLES_TTL_SEC = 120_000;

  private rolesLastKey() {
    return `kc:roles:last:${this.realm}`;
  }

  constructor(
    private readonly cs: ConfigService,
    @Inject(LOGGER) private readonly logger: LoggerLike,
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {
    // Keep-alive agents for lower latency
    this.http = axios.create({
      timeout: 8000,
      httpAgent: new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 10_000,
        maxSockets: 50,
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 10_000,
        maxSockets: 50,
      }),
      validateStatus: (s) => s >= 200 && s < 500,
    });
    (this.cache as any)?.on?.('error', (e: any) =>
      console.error('[cache_error]', e?.message || e)
    );
  }

  private get base() {
    return this.cs.get<string>(ConfigKey.KEYCLOAK_SERVER_URL)!;
  }
  private get realm() {
    return this.cs.get<string>(ConfigKey.KEYCLOAK_REALM)!;
  }
  private get cid() {
    return this.cs.get<string>(ConfigKey.OIDC_SVC_CLIENT)!;
  }
  private get sec() {
    return this.cs.get<string>(ConfigKey.OIDC_SVC_CLIENT_SECRET)!;
  }

  private tokenUrl() {
    return `${this.base}/realms/${this.realm}/protocol/openid-connect/token`;
  }
  private admin(path: string) {
    return `${this.base}/admin/realms/${this.realm}${
      path.startsWith('/') ? '' : '/'
    }${path}`;
  }

  // -------------------- Core HTTP with logging & 1 retry on transient net errors --------------------
  private async kcRequest<T = any>(
    method: Method,
    url: string,
    cfg: AxiosRequestConfig = {}
  ) {
    const started = Date.now();
    const requestId = getRequestContext()?.requestId ?? '';

    const body = cfg.data;
    const reqSize =
      body === undefined
        ? undefined
        : Buffer.byteLength(
            typeof body === 'string'
              ? body
              : body instanceof URLSearchParams
              ? body.toString()
              : JSON.stringify(body)
          );

    this.logger.info({
      msg: 'http_request',
      method,
      path: url,
      requestId,
      reqSize,
      target: 'keycloak',
    });

    try {
      // 1st attempt with keep-alive
      const res = await this.http.request<T>({ method, url, ...cfg });
      const r = res.data as unknown as string | object | undefined;
      const resSize =
        r === undefined
          ? undefined
          : Buffer.byteLength(typeof r === 'string' ? r : JSON.stringify(r));
      this.logger.info({
        msg: 'http_response',
        method,
        path: url,
        status: res.status,
        durationMs: Date.now() - started,
        resSize,
        requestId,
        target: 'keycloak',
      });
      return res;
    } catch (e: any) {
      // Retry once on transient network errors **without** keep-alive (fresh socket)
      if (isTransientNetErr(e)) {
        this.logger.info({
          msg: 'http_retry',
          reason: e.code,
          path: url,
          target: 'keycloak',
        });
        const noKA: AxiosRequestConfig = {
          httpAgent: new http.Agent({ keepAlive: false }),
          httpsAgent: new https.Agent({
            keepAlive: false,
            rejectUnauthorized: (this.base.startsWith('https://')
              ? true
              : undefined) as any,
          }),
          timeout: this.http.defaults.timeout,
        };
        const res = await this.http.request<T>({
          method,
          url,
          ...noKA,
          ...cfg,
        });
        const r = res.data as unknown as string | object | undefined;
        const resSize =
          r === undefined
            ? undefined
            : Buffer.byteLength(typeof r === 'string' ? r : JSON.stringify(r));
        this.logger.info({
          msg: 'http_response',
          method,
          path: url,
          status: res.status,
          durationMs: Date.now() - started,
          resSize,
          requestId,
          target: 'keycloak',
          retry: true,
        });
        return res;
      }

      const ax = e as AxiosError;
      this.logger.error({
        msg: 'http_response_error',
        method,
        path: url,
        status: ax.response?.status,
        durationMs: Date.now() - started,
        error: {
          message: ax.message,
          data: ax.response?.data,
          name: ax.name,
          code: (ax as any).code,
        },
        requestId,
        target: 'keycloak',
      });
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // -------------------- Redis-backed caches --------------------
  private tokenKey() {
    return `kc:token:${this.realm}:${this.cid}`;
  }
  private rolesKey() {
    return `kc:roles:${this.realm}`;
  }

  private async getAdminToken(): Promise<string> {
    // 1) try redis
    const cached = (await this.cache.get<string>(this.tokenKey())) || undefined;
    if (cached) return cached;

    // 2) singleflight per instance
    const sf = `sf:${this.tokenKey()}`;
    if (this.inflight.has(sf)) return this.inflight.get(sf)!;

    const p = (async () => {
      const data = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.cid,
        client_secret: this.sec,
      });

      const { data: out } = await this.kcRequest<{
        access_token: string;
        expires_in: number;
      }>('POST', this.tokenUrl(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data,
      });

      // Safety margin avoids edge expiry
      const ttlSec = Math.max(30, (out?.expires_in ?? 60) - 15);
      await this.cache.set(this.tokenKey(), out.access_token, ttlSec * 1000);

      return out.access_token;
    })().finally(() => this.inflight.delete(sf));

    this.inflight.set(sf, p);
    return p;
  }

  // Return fresh cache if present; else fetch and cache.
  async getRealmRolesCached(): Promise<KCRealmRole[]> {
    const key = this.rolesKey();
    const cached = (await this.cache.get<KCRealmRole[]>(key)) || undefined;
    if (cached) return cached;

    const sf = `sf:${key}`;
    if (this.inflight.has(sf)) return this.inflight.get(sf)!;

    const p = (async () => {
      const token = await this.getAdminToken();
      const { data, status } = await this.kcRequest<KCRealmRole[]>(
        'GET',
        this.admin(`/roles?briefRepresentation=true&first=0&max=200`),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!Array.isArray(data)) {
        this.logger.error({ msg: 'kc_roles_unexpected_payload', status });
        throw rpcErr({
          type: RPCCode.INTERNAL_SERVER_ERROR,
          code: serverError.INTERNAL_SERVER_ERROR,
          message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
        });
      }

      const filtered = data.filter((r) => REALM_ROLES.has(r.name as RoleName));
      await this.cache.set(key, filtered, this.ROLES_TTL_SEC);
      return filtered;
    })().finally(() => this.inflight.delete(sf));

    this.inflight.set(sf, p);
    return p;
  }

  // SWR provider for roles: returns fresh if available, else stale while refreshing; cold-start blocks.
  async getRealmRolesSWR(): Promise<KCRealmRole[]> {
    const fresh =
      (await this.cache.get<KCRealmRole[]>(this.rolesKey())) || undefined;
    if (Array.isArray(fresh) && fresh.length) return fresh;

    const stale =
      (await this.cache.get<KCRealmRole[]>(this.rolesLastKey())) || undefined;

    // Background refresh (single-flight)
    this.refreshRealmRoles().catch((e) =>
      this.logger?.info?.({ msg: 'kc_roles_refresh_failed', err: String(e) })
    );

    if (Array.isArray(stale) && stale.length) return stale;

    // Cold start: do a blocking fetch
    return this.refreshRealmRoles();
  }

  // Actual fetch that fills both fresh and last-known-good caches
  private async refreshRealmRoles(): Promise<KCRealmRole[]> {
    const key = this.rolesKey();
    const sf = `sf:${key}`;
    if (this.inflight.has(sf)) return this.inflight.get(sf)!;

    const p = (async () => {
      const token = await this.getAdminToken();
      const { data, status } = await this.kcRequest<KCRealmRole[]>(
        'GET',
        this.admin(`/roles?briefRepresentation=true&first=0&max=200`),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!Array.isArray(data)) {
        this.logger.error({ msg: 'kc_roles_unexpected_payload', status });
        throw rpcErr({
          type: RPCCode.INTERNAL_SERVER_ERROR,
          code: serverError.INTERNAL_SERVER_ERROR,
          message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
        });
      }

      const filtered = data.filter((r) => REALM_ROLES.has(r.name as RoleName));

      await this.cache.set(key, filtered, this.ROLES_TTL_SEC);
      await this.cache.set(this.rolesLastKey(), filtered);

      return filtered;
    })().finally(() => this.inflight.delete(sf));

    this.inflight.set(sf, p);
    return p;
  }

  private async getRoleByNameCached(
    name: RoleName
  ): Promise<KCRealmRole | undefined> {
    const roles = await this.getRealmRolesCached();
    return roles.find((r) => r.name === name);
  }
  async sendEmail(id: string, checkUserExistance?: boolean) {
    const token = await this.getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };

    if (checkUserExistance) {
      try {
        const { data } = await this.kcRequest<KCUser>(
          'GET',
          this.admin(`/users/${id}`),
          { headers }
        );
        if (!data?.id) {
          throw rpcErr({
            type: RPCCode.BAD_REQUEST,
            code: AccountManagementErrCodes.USER_NOT_FOUND,
            message: AccountManagementErrMessage.USER_NOT_FOUND,
          });
        }
      } catch (err) {
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: AccountManagementErrCodes.USER_NOT_FOUND,
          message: AccountManagementErrMessage.USER_NOT_FOUND,
        });
      }
    }

    const res = await this.kcRequest(
      'PUT',
      this.admin(`/users/${id}/execute-actions-email`),
      { headers, data: ['VERIFY_EMAIL', 'UPDATE_PASSWORD'] }
    );

    if (!res || (res.status && res.status !== 204)) {
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }

    return true;
  }
  // -------------------- Public APIs (signatures & return data preserved) --------------------
  async inviteUser(data: InviteUser): Promise<KCUser> {
    const token = await this.getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };

    const username = `${data.firstName} ${data.lastName}`
      .replaceAll(' ', '_')
      .toLowerCase();

    const createRes = await this.kcRequest('POST', this.admin('/users'), {
      headers,
      data: {
        username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        enabled: true,
      },
    });

    let id: string | undefined;

    if (createRes.status === 201 || createRes.status === 204) {
      id = createRes.headers?.location?.toString().split('/').pop();
    } else if (createRes.status === 409) {
      throw rpcErr({
        type: RPCCode.CONFLICT,
        code: AccountManagementErrCodes.USER_EXIST,
        message: AccountManagementErrMessage.USER_EXIST,
      });
    } else {
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }

    if (!id) {
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }

    const user = await this.kcRequest<KCUser>(
      'GET',
      this.admin(`/users/${id}`),
      { headers }
    );
    if (!user) {
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }

    // Assign role using cached roles (avoids an extra /roles call)
    const requiredRole = await this.getRoleByNameCached(data.role as RoleName);
    if (!requiredRole) {
      throw rpcErr({
        type: RPCCode.BAD_REQUEST,
        code: 'ROLE_NOT_FOUND',
        message: `Role '${data.role}' does not exist in realm ${this.realm}`,
      });
    }

    await this.kcRequest(
      'POST',
      this.admin(`/users/${user.data.id}/role-mappings/realm`),
      { headers, data: [requiredRole] }
    );

    await this.sendEmail(id);

    return user.data as KCUser;
  }

  async setEnabled(kcUserId: string, enabled: boolean) {
    const t = await this.getAdminToken();
    await this.kcRequest('PUT', this.admin(`/users/${kcUserId}`), {
      headers: { Authorization: `Bearer ${t}` },
      data: { enabled },
    });
    return { kcUserId, enabled };
  }

  async setRealmRoles(kcUserId: string, roleName: RoleName) {
    const t = await this.getAdminToken();
    const headers = { Authorization: `Bearer ${t}` };
    try {
      const { data: current } = await this.kcRequest<KCRealmRole[]>(
        'GET',
        this.admin(`/users/${kcUserId}/role-mappings/realm`),
        { headers }
      );

      const reserved = new Set([
        `default-roles-${this.realm}`,
        'offline_access',
      ]);
      const toRemove = (current ?? []).filter(
        (r) =>
          !reserved.has(r.name) &&
          !r.clientRole &&
          REALM_ROLES.has(r.name as RoleName)
      );

      if (toRemove.length) {
        await this.kcRequest(
          'DELETE',
          this.admin(`/users/${kcUserId}/role-mappings/realm`),
          {
            headers,
            data: toRemove,
          }
        );
      }

      const required = await this.getRoleByNameCached(roleName);
      if (!required) {
        throw rpcErr({
          type: RPCCode.BAD_REQUEST,
          code: 'ROLE_NOT_FOUND',
          message: `Role '${roleName}' does not exist in realm ${this.realm}`,
        });
      }

      await this.kcRequest(
        'POST',
        this.admin(`/users/${kcUserId}/role-mappings/realm`),
        {
          headers,
          data: [required],
        }
      );

      const { data: after } = await this.kcRequest<KCRealmRole[]>(
        'GET',
        this.admin(`/users/${kcUserId}/role-mappings/realm`),
        { headers }
      );

      const roles = (after ?? [])
        .map((r) => r.name)
        .filter((n): n is RoleName => REALM_ROLES.has(n as RoleName));

      return { kcUserId, roles };
    } catch (e) {
      console.debug(e);
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getUser(kcUserId: string) {
    const t = await this.getAdminToken();
    const { data } = await this.kcRequest<KCUser>(
      'GET',
      this.admin(`/users/${kcUserId}`),
      { headers: { Authorization: `Bearer ${t}` } }
    );
    return data;
  }
}
