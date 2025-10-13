import { Controller, Get } from '@nestjs/common';
import { TicketingService } from './ticketing.service';

@Controller()
export class TicketingController {
  constructor(private readonly appService: TicketingService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }
}
