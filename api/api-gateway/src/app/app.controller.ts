import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiOkResponseEnvelope,
  ApiServerGatewayTimeout,
  HealthDto,
} from '@slamint/core';

import { Public } from '@slamint/auth';

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
