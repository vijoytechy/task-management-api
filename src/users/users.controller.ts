import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {  createUserSchema } from './dto/create-user.dto';
import {  updateUserSchema } from './dto/update-user.dto';

import { z } from 'zod';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

type CreateUserDto = z.infer<typeof createUserSchema>;
type UpdateUserDto = z.infer<typeof updateUserSchema>;


@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('Admin')
  create(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto,
    @Req() req,
  ) {
    return this.usersService.create(dto, req.user);
  }

  @Get()
  @Roles('Admin')
  findAll(@Req() req) {
    return this.usersService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto,
    @Req() req,
  ) {
    return this.usersService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles('Admin')
  remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.user);
  }
}
