import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TicketPriority,
  TicketStatus,
  TicketType,
} from '../../enums/ticketing.enum';
import { Department } from '../department/department.entity';
import { AppUser } from '../users/user.entity';
import {
  TicketAttachment,
  TicketComment,
  TicketSLA,
  TicketStatusHistory,
} from './ticket-extras.entity';

// core/ticketing/enums.ts

// api/ticketing/src/entities/ticket.entity.ts
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) code!: string;
  @Column() title!: string;
  @Column('text') description!: string;
  @Column({ type: 'enum', enum: TicketType }) type!: TicketType;
  @Column({ type: 'enum', enum: TicketPriority }) priority!: TicketPriority;
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status!: TicketStatus;

  @ManyToOne(() => Department) department!: Department;

  @ManyToOne(() => AppUser) reporter!: AppUser;
  @ManyToOne(() => AppUser) createdBy!: AppUser;

  @ManyToMany(() => AppUser)
  @JoinTable({ name: 'ticket_assignees' })
  assignees!: AppUser[];
  @ManyToMany(() => AppUser)
  @JoinTable({ name: 'ticket_watchers' })
  watchers!: AppUser[];

  @Column('text', { array: true, default: '{}' }) tags!: string[];

  @OneToMany(() => TicketAttachment, (a) => a.ticket)
  attachments!: TicketAttachment[];
  @OneToMany(() => TicketComment, (c) => c.ticket) comments!: TicketComment[];
  @OneToMany(() => TicketStatusHistory, (h) => h.ticket)
  statusHistory!: TicketStatusHistory[];

  @OneToOne(() => TicketSLA, (s) => s.ticket) @JoinColumn() sla!: TicketSLA;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date | null;
}
