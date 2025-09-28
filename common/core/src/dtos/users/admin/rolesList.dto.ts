export interface KCRealmRole {
  id: string;
  name: string;
  description?: string;
  composite: boolean;
  clientRole: boolean;
  containerId: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class RoleItem {
  @ApiProperty({
    type: String,
    example: '3216becf-ce28-4713-bf68-a2ed7d135496',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    type: String,
    example: 'admin',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    type: String,
    example: 'admin role for SLAMint',
  })
  @Expose()
  description!: string;
  @Exclude()
  composite!: boolean;
  @Exclude()
  clientRole!: boolean;
  @Exclude()
  containerId!: string;
}
