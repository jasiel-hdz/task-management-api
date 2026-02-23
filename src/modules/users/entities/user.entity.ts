import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Task } from '../../tasks/entities/task.entity';

/**
 * User entity. Stores team members and admins.
 * Relation to Task is used for "finished tasks count" and "cost sum" in list users.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @ManyToMany(() => Task, (task) => task.assignees, { onDelete: 'CASCADE' })
  tasks: Task[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
