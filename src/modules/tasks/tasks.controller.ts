import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskTimeDto } from './dto/update-task-time.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskAnalytics, TaskWithAssignees } from './interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  async create(@Body() dto: CreateTaskDto): Promise<TaskWithAssignees> {
    return this.tasksService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: QueryTasksDto): Promise<TaskWithAssignees[]> {
    return this.tasksService.findAll(query);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  async getAnalytics(): Promise<TaskAnalytics> {
    return this.tasksService.getAnalytics();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<TaskWithAssignees> {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskWithAssignees> {
    return this.tasksService.update(id, dto);
  }

  @Patch(':id/time')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER, UserRole.ADMINISTRATOR)
  async updateTime(
    @Param('id') id: string,
    @Body() dto: UpdateTaskTimeDto,
  ): Promise<TaskWithAssignees> {
    return this.tasksService.updateActualHours(id, dto.actualHours);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER, UserRole.ADMINISTRATOR)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<TaskWithAssignees> {
    return this.tasksService.updateStatus(id, dto.status);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  async patch(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskWithAssignees> {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}
