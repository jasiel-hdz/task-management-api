import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsersService, UserListResult } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { User } from './entities/user.entity';

/**
 * Users controller. Exposes create and list endpoints.
 * List supports filters by name, email, role and includes finished tasks count and cost sum.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get()
  async findAll(@Query() query: QueryUsersDto): Promise<UserListResult[]> {
    return this.usersService.findAll(query);
  }
}
