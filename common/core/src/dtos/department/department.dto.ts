import { Expose } from 'class-transformer';

export class DepartmentDto {
  @Expose()
  id!: string;

  @Expose()
  code!: string;

  @Expose()
  name!: string;
}
