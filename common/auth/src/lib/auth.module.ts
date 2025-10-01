import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';

import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { OidcConfigProvider } from './oidc.provider';

import { ConfigModule } from '@nestjs/config';
import { MicroserviceClientsModule } from '@slamint/core';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MicroserviceClientsModule,
  ],
  providers: [
    OidcConfigProvider,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [PassportModule],
})
export class AuthModule {}
