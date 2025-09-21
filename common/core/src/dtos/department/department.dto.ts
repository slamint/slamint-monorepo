import { Expose, Type } from 'class-transformer';
import { LiteUserRef } from '../users/user.dto';

export class DepartmentDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose({ groups: ['manager', 'admin'] })
  @Type(() => LiteUserRef)
  departmentHead?: LiteUserRef;
}
