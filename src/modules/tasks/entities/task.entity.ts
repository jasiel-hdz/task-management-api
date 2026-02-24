import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { TaskStatus } from '../../../common/enums/task-status.enum';
import { UserTask } from './user-task.entity';

/** Task entity. Users via UserTask join (OneToMany). */
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

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualHours: number;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.ACTIVE })
  status: TaskStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost: number;

  @OneToMany(() => UserTask, (userTask) => userTask.task, { cascade: true })
  userTasks: UserTask[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
