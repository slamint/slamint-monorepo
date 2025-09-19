import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

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
