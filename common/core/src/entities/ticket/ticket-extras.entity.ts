import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  SLAStatus,
  TicketStatus,
  Visibility,
} from '../../enums/ticketing.enum';
import { AppUser } from '../users/user.entity';
import { Ticket } from './ticket.entity';

@Entity('ticket_comments')
export class TicketComment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Ticket, (t) => t.comments) ticket!: Ticket;
  @ManyToOne(() => AppUser) author!: AppUser;
  @Column({ type: 'enum', enum: Visibility, default: Visibility.INTERNAL })
  visibility!: Visibility;
  @Column('text') body!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

@Entity('ticket_attachments')
export class TicketAttachment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Ticket, (t) => t.attachments) ticket!: Ticket;
  @ManyToOne(() => AppUser) uploadedBy!: AppUser;
  @Column() name!: string;
  @Column() url!: string;
  @Column() mime!: string;
  @Column('int') size!: number;
  @CreateDateColumn() createdAt!: Date;
}

@Entity('ticket_status_history')
export class TicketStatusHistory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Ticket, (t) => t.statusHistory) ticket!: Ticket;
  @ManyToOne(() => AppUser) actor!: AppUser;
  @Column({ type: 'enum', enum: TicketStatus }) from!: TicketStatus;
  @Column({ type: 'enum', enum: TicketStatus }) to!: TicketStatus;
  @Column({ nullable: true }) reason?: string;
  @CreateDateColumn() at!: Date;
}

@Entity('ticket_sla')
export class TicketSLA {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @OneToOne(() => Ticket, (t) => t.sla) ticket!: Ticket;
  @Column({ type: 'timestamp', nullable: true }) dueAt?: Date;
  @Column({ type: 'enum', enum: SLAStatus, default: SLAStatus.ON_TRACK })
  status!: SLAStatus;
  @Column({ default: false }) paused!: boolean;
  @Column({ type: 'int', default: 0 }) pausedMs!: number;
  @Column({ type: 'int', default: 0 }) elapsedMs!: number;
  @UpdateDateColumn() updatedAt!: Date;
}
