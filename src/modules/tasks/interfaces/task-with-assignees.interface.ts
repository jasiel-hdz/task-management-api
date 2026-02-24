import { Task } from '../entities/task.entity';
import { User } from '../../users/entities/user.entity';

/** Task with assignees array (replaces userTasks in API responses). */
export type TaskWithAssignees = Omit<Task, 'userTasks'> & { assignees: User[] };
