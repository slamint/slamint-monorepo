import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserMe {
  @Expose()
  @ApiProperty({ example: 'JohnDoe' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @Expose()
  @ApiProperty({ example: ['user'] })
  roles!: string[];
}
