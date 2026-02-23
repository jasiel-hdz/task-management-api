import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Raw } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { TaskStatus } from '../../common/enums/task-status.enum';

/** Response shape for list users: user plus finished tasks count and cost sum. */
export interface UserListResult {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  finishedTasksCount: number;
  totalFinishedTasksCost: number;
}

/**
 * Users service. Handles create and list with filters.
 * List includes aggregated finished tasks count and sum of cost of finished tasks per user.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a new user. Throws ConflictException if email already exists.
   */
  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  /**
   * Lists all users with optional filters (name, email, role).
   * Each user includes finishedTasksCount and totalFinishedTasksCost (only finished tasks).
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

    const users = await this.userRepository.find({
      where,
      relations: ['tasks'],
    });

    return users.map((user) => {
      const finishedTasks = (user.tasks ?? []).filter((t) => t.status === TaskStatus.FINISHED);
      const totalFinishedTasksCost = finishedTasks.reduce(
        (sum, t) => sum + Number(t.cost),
        0,
      );
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        finishedTasksCount: finishedTasks.length,
        totalFinishedTasksCost,
      };
    });
  }
}
