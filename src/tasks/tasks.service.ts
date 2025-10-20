import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectPinoLogger(TasksService.name) private readonly logger: PinoLogger,
  ) {}

  // Create new task (Admin only)
  async create(dto: CreateTaskDto, user: any): Promise<Task> {
    if (user.role !== 'Admin') {
      throw new ForbiddenException('Only Admin can create or assign tasks');
    }

    if (!dto.title) {
      throw new BadRequestException('Task title is required');
    }

    if (dto.assignedTo && !Types.ObjectId.isValid(dto.assignedTo)) {
      throw new BadRequestException('Invalid assignedTo ObjectId');
    }

    try {
      const task = new this.taskModel({
        ...dto,
        createdBy: user.userId,
      });
      const saved = await task.save();

      this.logger.info(
        { userId: user.userId, email: user.email, taskId: saved.id, title: saved.title },
        'Task created',
      );
      return saved;
    } catch (err) {
      this.logger.error({ err, userId: user.userId, email: user.email }, 'Error creating task');
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  // Fetch all tasks — Admin/Manager sees all; users see their own
  async findAll(user: any): Promise<Task[]> {
    try {
      if (user.role === 'Admin' || user.role === 'Manager') {
        return this.taskModel.find().populate('assignedTo', 'email name').exec();
      }

      return this.taskModel
        .find({ assignedTo: user.userId })
        .populate('assignedTo', 'email name')
        .exec();
    } catch (err) {
      this.logger.error({ err, userId: user.userId, email: user.email }, 'Error fetching tasks');
      throw new InternalServerErrorException('Failed to fetch tasks');
    }
  }

  // Get a single task by ID
  async findOne(id: string, user: any): Promise<Task> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Task ID');
    }

    const task = await this.taskModel.findById(id).populate('assignedTo', 'email').exec();
    if (!task) throw new NotFoundException('Task not found');

    if (user.role !== 'Admin' && task.assignedTo?.toString() !== user.userId) {
      throw new ForbiddenException('You can only view your own tasks');
    }

    return task;
  }

  // Update a task — Admin or owner
  async update(id: string, dto: UpdateTaskDto, user: any): Promise<Task> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Task ID');
    }

    const task = await this.taskModel.findById(id);
    if (!task) throw new NotFoundException('Task not found');

    if (user.role !== 'Admin' && task.assignedTo?.toString() !== user.userId) {
      throw new ForbiddenException('You can only edit your own tasks');
    }

    Object.assign(task, dto);
    const updated = await task.save();

    this.logger.info(
      { userId: user.userId, email: user.email, taskId: updated.id, title: updated.title },
      'Task updated',
    );
    return updated;
  }

  // Delete a task — Admin only
  async remove(id: string, user: any): Promise<void> {
    if (user.role !== 'Admin') {
      throw new ForbiddenException('Only Admin can delete tasks');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Task ID');
    }

    const task = await this.taskModel.findById(id);
    if (!task) throw new NotFoundException('Task not found');

    await this.taskModel.findByIdAndDelete(id);
    this.logger.info({ userId: user.userId, email: user.email, taskId: id }, 'Task deleted');
  }
}

