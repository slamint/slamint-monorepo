export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}
export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
export enum TicketType {
  INCIDENT = 'INCIDENT',
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  CHANGE = 'CHANGE',
  TASK = 'TASK',
}
export enum SLAStatus {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  BREACHED = 'BREACHED',
  PAUSED = 'PAUSED',
}
export enum Visibility {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
}
