// department.entity.ts
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ length: 64 })
  code!: string;

  @Column({ length: 128 })
  name!: string;

  @Column({ default: true })
  isActive!: boolean;
}
