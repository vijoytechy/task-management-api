import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { createTaskSchema } from './dto/create-task.dto';
import { updateTaskSchema } from './dto/update-task.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

type CreateTaskDto = z.infer<typeof createTaskSchema>;
type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('Admin')
  async create(
    @Body(new ZodValidationPipe(createTaskSchema)) dto: CreateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.create(dto, req.user);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.tasksService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.findOne(id, req.user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles('Admin')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.remove(id, req.user);
  }
}
