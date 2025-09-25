import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig, Method } from 'axios';

import type { KCRealmRole, KCUser } from '@slamint/auth';
import type { InviteUser, LoggerLike } from '@slamint/core';
import {
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

@Injectable()
export class KeycloakService {
  constructor(
    private readonly cs: ConfigService,
    @Inject(LOGGER) private readonly logger: LoggerLike
  ) {}

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
      const res = await axios.request<T>({ method, url, ...cfg });
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
    } catch (e) {
      const ax = e as AxiosError;
      this.logger.error({
        msg: 'http_response_error',
        method,
        path: url,
        status: ax.response?.status,
        durationMs: Date.now() - started,
        error: { message: ax.message, data: ax.response?.data, name: ax.name },
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

  private async getAdminToken(): Promise<string> {
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.cid,
      client_secret: this.sec,
    });
    try {
      const { data: out } = await this.kcRequest<{ access_token: string }>(
        'POST',
        this.tokenUrl(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          data,
        }
      );
      return out.access_token;
    } catch {
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async inviteUser(data: InviteUser): Promise<KCUser> {
    try {
      const token = await this.getAdminToken();

      const res = await this.kcRequest('POST', this.admin('/users'), {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          username: `${data.firstName} ${data.lastName}`
            .replaceAll(' ', '_')
            .toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          enabled: true,
        },
      });

      if (!res?.headers) {
        throw rpcErr({
          type: RPCCode.INTERNAL_SERVER_ERROR,
          code: serverError.INTERNAL_SERVER_ERROR,
          message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
        });
      }
      const id = res.headers.location.toString().split('/').pop();
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!user) {
        throw rpcErr({
          type: RPCCode.INTERNAL_SERVER_ERROR,
          code: serverError.INTERNAL_SERVER_ERROR,
          message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
        });
      }

      const triggerEmail = await this.kcRequest(
        'PUT',
        this.admin(`/users/${id}/execute-actions-email`),
        {
          headers: { Authorization: `Bearer ${token}` },
          data: ['VERIFY_EMAIL', 'UPDATE_PASSWORD'],
        }
      );

      if (!triggerEmail) {
        throw rpcErr({
          type: RPCCode.INTERNAL_SERVER_ERROR,
          code: serverError.INTERNAL_SERVER_ERROR,
          message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
        });
      }

      // Assign Roles
      const { data: availableRoles } = await this.kcRequest<KCRealmRole[]>(
        'GET',
        this.admin(`/roles`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const requiredRole = availableRoles.find((r) => r.name === data.role);

      await this.kcRequest(
        'POST',
        this.admin(`/users/${user.data.id}/role-mappings/realm`),
        { headers: { Authorization: `Bearer ${token}` }, data: [requiredRole] }
      );

      return user.data as KCUser;
    } catch (err) {
      console.debug(err);
      throw rpcErr({
        type: RPCCode.INTERNAL_SERVER_ERROR,
        code: serverError.INTERNAL_SERVER_ERROR,
        message: ServerErrorMessage.INTERNAL_SERVER_ERROR,
      });
    }
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
          { headers, data: toRemove }
        );
      }

      const { data: availableRoles } = await this.kcRequest<KCRealmRole[]>(
        'GET',
        this.admin(`/roles`),
        { headers }
      );
      const required = availableRoles.find((r) => r.name === roleName);

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
        { headers, data: [required] }
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
      {
        headers: { Authorization: `Bearer ${t}` },
      }
    );
    return data;
  }
}
