import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

import { JwtStrategy } from './jwt.strategy';
import { OidcConfigProvider } from './oidc.provider';
import { JwtAuthGuard } from './jwt-auth.guard';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    OidcConfigProvider,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [PassportModule],
})
export class AuthModule {}
