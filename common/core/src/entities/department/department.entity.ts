import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AppUser } from '../users/user.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) name!: string;

  @ManyToOne(() => AppUser, { nullable: true, eager: false })
  departmentHead?: AppUser;
}
