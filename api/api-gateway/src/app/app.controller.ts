import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiOkResponseEnvelope,
  ApiServerGatewayTimeout,
  HealthDto,
} from '@slamint/core';

import { Public } from '@slamint/auth';

import { Controllers, HealthEndPoints, ApiVersion } from '@slamint/core/enums';

@ApiTags('Health Checks')
@Controller(`${Controllers.HEALTH}/${ApiVersion.VERSION_ONE}`)
export class AppController {
  @Public()
  @ApiOkResponseEnvelope(HealthDto)
  @ApiServerGatewayTimeout()
  @Get(HealthEndPoints.LIVE)
  liveness() {
    return { status: 'ok' };
  }

  @Public()
  @ApiOkResponseEnvelope(HealthDto)
  @ApiServerGatewayTimeout()
  @Get(HealthEndPoints.READY)
  readiness() {
    return { status: 'ok' };
  }
}
