import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, LessThan, Raw, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { UserTask } from './entities/user-task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import {
  TaskAnalytics,
  TaskWithAssignees,
  TopUserByCompletedTasks,
} from './interfaces';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
  ) {}

  async create(dto: CreateTaskDto): Promise<TaskWithAssignees> {
    const status = dto.status ?? TaskStatus.ACTIVE;
    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      estimatedHours: dto.estimatedHours ?? 0,
      actualHours: 0,
      dueDate: dto.dueDate ?? null,
      status,
      completedAt: status === TaskStatus.FINISHED ? new Date() : null,
      cost: dto.cost ?? 0,
    });
    const saved = await this.taskRepository.save(task);
    if (dto.assigneeIds?.length) {
      await this.setAssignees(saved.id, dto.assigneeIds);
    }
    return this.findOne(saved.id);
  }

  async findAll(query: QueryTasksDto): Promise<TaskWithAssignees[]> {
    let taskIdsByAssignee: string[] | null = null;
    if (query.assigneeId || query.assigneeName || query.assigneeEmail) {
      taskIdsByAssignee = await this.getTaskIdsByAssigneeFilters(query);
      if (taskIdsByAssignee.length === 0) return [];
    }

    const where: FindOptionsWhere<Task> = {};
    if (query.title) {
      where.title = Raw((alias: string) => `${alias} ILIKE :title`, {
        title: `%${query.title}%`,
      }) as never;
    }
    if (query.dueDate) {
      const start = new Date(query.dueDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(query.dueDate);
      end.setUTCHours(23, 59, 59, 999);
      where.dueDate = Between(start, end);
    }
    if (taskIdsByAssignee) {
      where.id = In(taskIdsByAssignee);
    }

    const tasks = await this.taskRepository.find({
      where,
      relations: ['userTasks', 'userTasks.user'],
      order: { createdAt: 'DESC' },
    });
    return tasks.map((t) => this.toTaskWithAssignees(t));
  }

  async findOne(id: string): Promise<TaskWithAssignees> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['userTasks', 'userTasks.user'],
    });
    if (!task) throw new NotFoundException(`Task with id "${id}" not found`);
    return this.toTaskWithAssignees(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskWithAssignees> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with id "${id}" not found`);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.estimatedHours !== undefined) task.estimatedHours = dto.estimatedHours;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate;
    if (dto.status !== undefined) {
      task.status = dto.status;
      task.completedAt = dto.status === TaskStatus.FINISHED ? new Date() : null;
    }
    if (dto.cost !== undefined) task.cost = dto.cost;

    await this.taskRepository.save(task);
    if (dto.assigneeIds !== undefined) {
      await this.setAssignees(id, dto.assigneeIds);
    }
    return this.findOne(id);
  }

  private toTaskWithAssignees(task: Task): TaskWithAssignees {
    const assignees = (task.userTasks ?? []).map((ut) => ut.user);
    const { userTasks: _, ...rest } = task;
    return { ...rest, assignees };
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with id "${id}" not found`);
    }
  }

  async getAnalytics(): Promise<TaskAnalytics> {
    const [totalTasks, activeTasks, completedTasks, overdueTasks] = await Promise.all([
      this.taskRepository.count(),
      this.taskRepository.count({ where: { status: TaskStatus.ACTIVE } }),
      this.taskRepository.count({ where: { status: TaskStatus.FINISHED } }),
      this.taskRepository.count({
        where: {
          status: TaskStatus.ACTIVE,
          dueDate: LessThan(new Date()),
        },
      }),
    ]);

    const sums = await this.taskRepository
      .createQueryBuilder('task')
      .select(
        'COALESCE(SUM(task.cost), 0)',
        'totalCost',
      )
      .addSelect('COALESCE(SUM(task.estimatedHours), 0)', 'totalEstimatedHours')
      .addSelect('COALESCE(SUM(task.actualHours), 0)', 'totalActualHours')
      .getRawOne<{ totalCost: string; totalEstimatedHours: string; totalActualHours: string }>();

    const [totalAssignments, totalUsers, usersWithAssignmentsRow, topUserRow] =
      await Promise.all([
        this.userTaskRepository.count(),
        this.userRepository.count(),
        this.userTaskRepository
          .createQueryBuilder('ut')
          .innerJoin('ut.user', 'u')
          .select('COUNT(DISTINCT u.id)', 'count')
          .getRawOne<{ count: string }>(),
        this.userTaskRepository
          .createQueryBuilder('ut')
          .innerJoin('ut.task', 'task')
          .innerJoin('ut.user', 'u')
          .where('task.status = :status', { status: TaskStatus.FINISHED })
          .select('u.id', 'userId')
          .addSelect('u.name', 'userName')
          .addSelect('u.email', 'userEmail')
          .addSelect('COUNT(task.id)', 'completedCount')
          .addSelect('COALESCE(SUM(task.cost), 0)', 'totalCostFromCompleted')
          .groupBy('u.id')
          .addGroupBy('u.name')
          .addGroupBy('u.email')
          .orderBy('COUNT(task.id)', 'DESC')
          .limit(1)
          .getRawOne<
            {
              userId: string;
              userName: string;
              userEmail: string;
              completedCount: string;
              totalCostFromCompleted: string;
            }
          >(),
      ]);

    const totalCost = sums ? parseFloat(sums.totalCost) : 0;
    const totalEstimatedHours = sums ? parseFloat(sums.totalEstimatedHours) : 0;
    const totalActualHours = sums ? parseFloat(sums.totalActualHours) : 0;
    const usersWithAssignments = usersWithAssignmentsRow?.count
      ? parseInt(usersWithAssignmentsRow.count, 10)
      : 0;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;
    const averageCostPerTask =
      totalTasks > 0 ? Math.round((totalCost / totalTasks) * 100) / 100 : 0;
    const averageActualHoursPerCompletedTask =
      completedTasks > 0
        ? Math.round((totalActualHours / completedTasks) * 100) / 100
        : 0;

    let topUserByCompletedTasks: TopUserByCompletedTasks | null = null;
    if (topUserRow?.userId && Number(topUserRow.completedCount) > 0) {
      topUserByCompletedTasks = {
        userId: topUserRow.userId,
        userName: topUserRow.userName,
        userEmail: topUserRow.userEmail,
        completedCount: parseInt(topUserRow.completedCount, 10),
        totalCostFromCompleted: parseFloat(topUserRow.totalCostFromCompleted),
      };
    }

    return {
      totalTasks,
      activeTasks,
      completedTasks,
      completionRate,
      overdueTasks,
      totalCost,
      averageCostPerTask,
      totalEstimatedHours,
      totalActualHours,
      averageActualHoursPerCompletedTask,
      totalAssignments,
      totalUsers,
      usersWithAssignments,
      topUserByCompletedTasks,
    };
  }

  async updateActualHours(
    id: string,
    actualHours: number,
    user: User,
  ): Promise<TaskWithAssignees> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with id "${id}" not found`);
    await this.ensureMemberCanModifyTask(id, user);
    task.actualHours = actualHours;
    await this.taskRepository.save(task);
    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<TaskWithAssignees> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with id "${id}" not found`);
    await this.ensureMemberCanModifyTask(id, user);
    task.status = status;
    task.completedAt = status === TaskStatus.FINISHED ? new Date() : null;
    await this.taskRepository.save(task);
    return this.findOne(id);
  }

  /** Members can only update time/status on tasks they are assigned to; admins can update any. */
  private async ensureMemberCanModifyTask(taskId: string, user: User): Promise<void> {
    if (user.role === UserRole.ADMINISTRATOR) return;
    const assigned = await this.userTaskRepository.findOne({
      where: { task: { id: taskId }, user: { id: user.id } },
    });
    if (!assigned) {
      throw new ForbiddenException('You can only update tasks assigned to you');
    }
  }

  private async setAssignees(taskId: string, userIds: string[]): Promise<void> {
    await this.userTaskRepository.delete({ task: { id: taskId } });
    if (userIds.length === 0) return;
    const users = await this.userRepository.find({ where: { id: In(userIds) } });
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) return;
    const toSave = users.map((user) =>
      this.userTaskRepository.create({ task, user }),
    );
    await this.userTaskRepository.save(toSave);
  }

  private async getTaskIdsByAssigneeFilters(query: QueryTasksDto): Promise<string[]> {
    const qb = this.userTaskRepository
      .createQueryBuilder('ut')
      .innerJoin('ut.user', 'u')
      .innerJoin('ut.task', 'task')
      .select('DISTINCT task.id', 'taskId');

    if (query.assigneeId) {
      qb.andWhere('u.id = :assigneeId', { assigneeId: query.assigneeId });
    }
    if (query.assigneeName) {
      qb.andWhere('u.name ILIKE :assigneeName', {
        assigneeName: `%${query.assigneeName}%`,
      });
    }
    if (query.assigneeEmail) {
      qb.andWhere('u.email ILIKE :assigneeEmail', {
        assigneeEmail: `%${query.assigneeEmail}%`,
      });
    }

    const result = await qb.getRawMany<{ taskId: string }>();
    return result.map((r) => r.taskId);
  }
}
