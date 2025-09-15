import { Controller, Get } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('admin/audit/v1')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  getLogs() {
    return this.auditService.findAll();
  }
}
