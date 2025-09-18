import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountManagementService {
  getData(): { name: string } {
    return { name: 'pradeep' };
  }
}
