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
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createRoleSchema } from './dto/create-role.dto';
import { updateRoleSchema } from './dto/update-role.dto';
import { z } from 'zod';

//  Zod schemas
type CreateRoleDto = z.infer<typeof createRoleSchema>;
type UpdateRoleDto = z.infer<typeof updateRoleSchema>;

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**  Create new role (Admin only) */
  @Post()
  @Roles('Admin')
  create(
    @Body(new ZodValidationPipe(createRoleSchema)) dto: CreateRoleDto,
    @Req() req,
  ) {
    return this.rolesService.create(dto.name, dto.description, req.user);
  }

  /**  Get all roles (Admin only) */
  @Get()
  @Roles('Admin')
  findAll() {
    return this.rolesService.findAll();
  }

  /**  Get one role (Admin only) */
  @Get(':id')
  @Roles('Admin')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  /**  Update role (Admin only) */
  @Patch(':id')
  @Roles('Admin')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) dto: UpdateRoleDto,
    @Req() req,
  ) {
    return this.rolesService.update(id, dto, req.user);
  }

  /** Delete role (Admin only) */
  @Delete(':id')
  @Roles('Admin')
  remove(@Param('id') id: string, @Req() req) {
    return this.rolesService.remove(id, req.user);
  }
}
