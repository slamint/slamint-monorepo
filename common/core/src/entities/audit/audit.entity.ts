import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true }) userId?: string;
  @Column({ nullable: true }) roles?: string;

  @Column() method!: string;
  @Column() path!: string;
  @Column('int') status!: number;
  @Column({ type: 'inet', nullable: true })
  ip?: string;
  @Column({ type: 'json', nullable: true }) meta?: any;
}
