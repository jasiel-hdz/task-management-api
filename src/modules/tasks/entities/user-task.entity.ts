import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from './task.entity';

/** Join entity User–Task (many-to-many). Table user_tasks. Unique on (user, task). */
@Entity('user_tasks')
@Unique(['user', 'task'])
@Index(['user'])
@Index(['task'])
export class UserTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userTasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Task, (task) => task.userTasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'assigned_at',
  })
  assignedAt: Date;
}
