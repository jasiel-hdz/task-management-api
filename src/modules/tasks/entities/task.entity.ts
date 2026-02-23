import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
} from 'typeorm';
import { TaskStatus } from '../../../common/enums/task-status.enum';
import { User } from '../../users/entities/user.entity';

/**
 * Task entity. Minimal fields here for User->Task relation and aggregates.
 * Full task fields (title, description, estimatedHours, dueDate, cost, etc.) will be added when implementing the tasks module.
 */
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedHours: number;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.ACTIVE })
  status: TaskStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost: number;

  @ManyToMany(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  assignees: User[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
