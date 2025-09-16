import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/roles.decorator';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiOkResponseEnvelope,
  ApiServerGatewayTimeout,
  HealthDto,
} from '@slamint/core';
@ApiTags('Health Checks')
@Controller('health')
export class AppController {
  @Public()
  @ApiOkResponseEnvelope(HealthDto)
  @ApiServerGatewayTimeout()
  @Get('live')
  liveness() {
    return { status: 'ok' };
  }

  @Public()
  @ApiOkResponseEnvelope(HealthDto)
  @ApiServerGatewayTimeout()
  @Get('ready')
  readiness() {
    return { status: 'ok' };
  }
}
