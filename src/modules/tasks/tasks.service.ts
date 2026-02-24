import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindOptionsWhere, In, Raw, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { UserTask } from './entities/user-task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskAnalytics, TaskWithAssignees } from './interfaces';
import { TaskStatus } from '../../common/enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTaskDto): Promise<TaskWithAssignees> {
    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      estimatedHours: dto.estimatedHours ?? 0,
      actualHours: 0,
      dueDate: dto.dueDate ?? null,
      status: dto.status ?? TaskStatus.ACTIVE,
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
    if (dto.status !== undefined) task.status = dto.status;
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
    const [totalRow] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM tasks`,
    );
    const [completedRow] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM tasks WHERE status = $1`,
      [TaskStatus.FINISHED],
    );
    const [costRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(cost::numeric), 0)::float AS total FROM tasks`,
    );
    return {
      totalTasks: totalRow?.total ?? 0,
      completedTasks: completedRow?.total ?? 0,
      totalCost: costRow?.total ?? 0,
    };
  }

  async updateActualHours(id: string, actualHours: number): Promise<TaskWithAssignees> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with id "${id}" not found`);
    task.actualHours = actualHours;
    await this.taskRepository.save(task);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: TaskStatus): Promise<TaskWithAssignees> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with id "${id}" not found`);
    task.status = status;
    await this.taskRepository.save(task);
    return this.findOne(id);
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
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (query.assigneeId) {
      conditions.push(`u.id = $${idx}`);
      params.push(query.assigneeId);
      idx++;
    }
    if (query.assigneeName) {
      conditions.push(`u.name ILIKE $${idx}`);
      params.push(`%${query.assigneeName}%`);
      idx++;
    }
    if (query.assigneeEmail) {
      conditions.push(`u.email ILIKE $${idx}`);
      params.push(`%${query.assigneeEmail}%`);
      idx++;
    }
    const result = await this.dataSource.query(
      `SELECT DISTINCT ut.task_id AS "taskId"
       FROM user_tasks ut
       INNER JOIN users u ON u.id = ut.user_id
       WHERE ${conditions.join(' AND ')}`,
      params,
    );
    return result.map((r: { taskId: string }) => r.taskId);
  }
}
