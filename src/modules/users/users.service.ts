import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Raw } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserTask } from '../tasks/entities/user-task.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserListResult } from './interfaces';
import { TaskStatus } from '../../common/enums/task-status.enum';

/** Create and list users with filters; list includes finished task count and total cost per user. */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
  ) {}

  /** Create user (password hashed). Throws if email exists. */
  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({ ...dto, password: hashedPassword });
    const saved = await this.userRepository.save(user);
    return this.userRepository.findOne({ where: { id: saved.id } }) as Promise<User>;
  }

  /**
   * List users with optional filters. Each user includes finishedTasksCount and totalFinishedTasksCost.
   */
  async findAll(query: QueryUsersDto): Promise<UserListResult[]> {
    const where: FindOptionsWhere<User> = {};

    if (query.name) {
      where.name = Raw((alias) => `${alias} ILIKE :name`, { name: `%${query.name}%` });
    }
    if (query.email) {
      where.email = Raw((alias) => `${alias} ILIKE :email`, { email: `%${query.email}%` });
    }
    if (query.role) {
      where.role = query.role;
    }

    const users = await this.userRepository.find({ where });

    if (users.length === 0) {
      return [];
    }

    const userIds = users.map((u) => u.id);
    const stats = await this.getFinishedTasksStatsByUserIds(userIds);

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      finishedTasksCount: stats[user.id]?.count ?? 0,
      totalFinishedTasksCost: stats[user.id]?.totalCost ?? 0,
    }));
  }

  /** Finished tasks count and total cost per user. */
  private async getFinishedTasksStatsByUserIds(
    userIds: string[],
  ): Promise<Record<string, { count: number; totalCost: number }>> {
    if (userIds.length === 0) return {};

    const rows = await this.userTaskRepository
      .createQueryBuilder('ut')
      .innerJoin('ut.task', 't')
      .innerJoin('ut.user', 'u')
      .where('t.status = :status', { status: TaskStatus.FINISHED })
      .andWhere('u.id IN (:...userIds)', { userIds })
      .select('u.id', 'userId')
      .addSelect('COUNT(t.id)', 'count')
      .addSelect('COALESCE(SUM(t.cost), 0)', 'totalCost')
      .groupBy('u.id')
      .getRawMany<{ userId: string; count: string; totalCost: string }>();

    const map: Record<string, { count: number; totalCost: number }> = {};
    for (const row of rows) {
      map[row.userId] = {
        count: parseInt(row.count, 10) || 0,
        totalCost: parseFloat(row.totalCost) || 0,
      };
    }
    return map;
  }
}
