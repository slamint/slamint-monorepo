import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleName } from '../../decorators/roles.decorator';
import { Department } from '../department/department.entity';

export enum AccountStatus {
  LOCKED = 'locked',
  ACTIVE = 'active',
}

@Entity('users')
export class AppUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  sub!: string;

  @Column({ type: 'text', nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  username?: string;

  @Column({ type: 'text', nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: RoleName, default: RoleName.user })
  role!: RoleName;

  @ManyToOne(() => AppUser, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  reportingManager?: AppUser | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department | null;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status!: AccountStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'first_login_at' })
  firstLoginAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'text', nullable: true, name: 'locked_reason' })
  lockedReason!: string;
}
