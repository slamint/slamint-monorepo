import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) name!:
    | 'admin'
    | 'engineer'
    | 'department-head'
    | 'manager'
    | 'user';
}
