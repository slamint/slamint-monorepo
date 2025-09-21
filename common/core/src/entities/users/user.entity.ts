import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../department/department.entity';
import { Role } from './roles.entity';

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

  @ManyToMany(() => Role, { eager: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'usersId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rolesId', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @ManyToOne(() => Department, { nullable: true, eager: false })
  department?: Department;

  @ManyToOne(() => AppUser, { nullable: true, eager: false })
  reportingManager?: AppUser;

  @Column({ type: 'timestamptz', nullable: true, name: 'first_login_at' })
  firstLoginAt?: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
