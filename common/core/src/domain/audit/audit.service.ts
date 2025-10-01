import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit/audit.entity.js';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>
  ) {}

  async write(partial: Partial<AuditLog>) {
    // Create Auditlog Instance to utilize the hooks are working
    const record = this.repo.create(partial);

    // Save Auditlog
    await this.repo.save(record);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
