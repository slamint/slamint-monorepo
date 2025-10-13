import {
  TicketPriority,
  TicketStatus,
  TicketType,
  Visibility,
} from '../../enums/ticketing.enum';

export type UUID = string;

export class CreateTicketDto {
  title!: string;
  description!: string;
  type!: TicketType;
  priority!: TicketPriority;
  departmentId!: UUID;
  reporterId?: UUID; // default from token
  tags?: string[];
  attachments?: { name: string; url: string; size: number; mime: string }[];
}

export class UpdateTicketDto {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export class AssignTicketDto {
  primaryAssigneeId!: UUID;
  additionalAssigneeIds?: UUID[];
}

export class TransitionDto {
  to!: TicketStatus;
  reason?: string;
  internalNote?: string;
}

export class CreateCommentDto {
  body!: string;
  visibility!: Visibility;
  attachments?: { name: string; url: string; size: number; mime: string }[];
}

export class ListTicketsQueryDto {
  page?: number; // default 1
  limit?: number; // default 20
  q?: string; // text
  status?: TicketStatus[];
  priority?: TicketPriority[];
  type?: TicketType[];
  departmentId?: UUID[];
  assigneeId?: UUID[];
  reporterId?: UUID[];
  createdFrom?: string;
  createdTo?: string;
  tag?: string[];
  sort?: 'createdAt' | 'updatedAt' | 'priority' | 'slaDueAt';
  order?: 'ASC' | 'DESC';
}

export class TicketDto {
  id!: UUID;
  code!: string; // human-readable eg "TCK-2025-000123"
  title!: string;
  description!: string;
  type!: TicketType;
  priority!: TicketPriority;
  status!: TicketStatus;
  department!: { id: UUID; name: string };
  reporter!: { id: UUID; name: string; email: string };
  assignees!: { id: UUID; name: string }[];
  watchers!: { id: UUID; name: string }[];
  tags!: string[];
  createdAt!: string;
  updatedAt!: string;
  sla!: { status: string; dueAt?: string; elapsedMs: number; paused: boolean };
}
