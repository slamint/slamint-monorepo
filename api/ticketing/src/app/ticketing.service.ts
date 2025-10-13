import { Injectable } from '@nestjs/common';

@Injectable()
export class TicketingService {
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
