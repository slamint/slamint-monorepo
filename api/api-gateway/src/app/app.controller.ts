import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthDto, PublicRoute } from '@slamint/core';
import { Controllers, HealthEndPoints, ApiVersion } from '@slamint/core/enums';

@ApiTags('Health Checks')
@Controller(`${Controllers.HEALTH}/${ApiVersion.VERSION_ONE}`)
export class AppController {
  @PublicRoute('GET', HealthEndPoints.LIVE, { model: HealthDto })
  liveness() {
    return { status: 'ok' };
  }

  @PublicRoute('GET', HealthEndPoints.READY, { model: HealthDto })
  readiness() {
    return { status: 'ok' };
  }
}
