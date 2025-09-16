import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { JwtStrategy } from './jwt.strategy';
import { OIDC_CONFIG, makeOidcConfig } from './oidc.provider';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    {
      provide: OIDC_CONFIG,
      useFactory: async (cs: ConfigService) => {
        const issuerUrl = cs.get<string>('OIDC_ISSUER') ?? '';
        return makeOidcConfig(issuerUrl);
      },
      inject: [ConfigService],
    },
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
