import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get('live') liveness() {
    return { status: 'ok' };
  }
  @Get('ready') readiness() {
    return { status: 'ok' };
  }
}
