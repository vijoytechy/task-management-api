import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { mapMongoError } from '../common/utils/mongo-error.util';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(@InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>) {}

  // mapMongoError now used directly from shared util

  async create(name: string, description = '', currentUser: any) {
    try {
      if (currentUser.role !== 'Admin') {
        throw new ForbiddenException('Only Admin can create roles');
      }
      const exists = await this.roleModel.findOne({ name });
      if (exists) throw new ConflictException('Role already exists');

      return await this.roleModel.create({ name, description });
    } catch (err) {
      if (err instanceof ForbiddenException ||
          err instanceof ConflictException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async findAll() {
    try {
      return this.roleModel.find().exec();
    } catch (err) {
      return mapMongoError(err, this.logger);
    }
  }

  async findOne(id: string) {
    try {
      const role = await this.roleModel.findById(id).exec();
      if (!role) throw new NotFoundException('Role not found');
      return role;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async update(id: string, data: { name?: string; description?: string }, currentUser: any) {
    try {
      if (currentUser.role !== 'Admin') {
        throw new ForbiddenException('Only Admin can update roles');
      }
      const role = await this.roleModel.findById(id);
      if (!role) throw new NotFoundException('Role not found');

      if (data.name) role.name = data.name;
      if (typeof data.description === 'string') role.description = data.description;

      await role.save();
      return role;
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async remove(id: string, currentUser: any) {
    try {
      if (currentUser.role !== 'Admin') {
        throw new ForbiddenException('Only Admin can delete roles');
      }
      const result = await this.roleModel.findByIdAndDelete(id);
      if (!result) throw new NotFoundException('Role not found');
      return { deleted: true };
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      return mapMongoError(err, this.logger);
    }
  }
}
