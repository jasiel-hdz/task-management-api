import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersSeedService } from './users-seed.service';
import { User } from './entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { UserTask } from '../tasks/entities/user-task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Task, UserTask])],
  controllers: [UsersController],
  providers: [UsersService, UsersSeedService],
  exports: [UsersService],
})
export class UsersModule {}
