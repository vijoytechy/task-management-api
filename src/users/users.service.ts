import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { mapMongoError } from '../common/utils/mongo-error.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) public readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  // mapMongoError now used directly from shared util

  async create(dto: CreateUserDto, currentUser: any): Promise<User> {
    try {
      if (currentUser.role !== 'Admin') {
        throw new ForbiddenException('Only Admin can create users');
      }

      const existing = await this.userModel.findOne({ email: dto.email });
      if (existing) throw new ConflictException('Email already in use');

      const roleDoc = await this.roleModel.findById(dto.role);
      if (!roleDoc) throw new BadRequestException('Invalid role ID');

      const hashed = await bcrypt.hash(dto.password, 10);
      const user = new this.userModel({ ...dto, password: hashed, role: roleDoc._id, isActive: true });

      const saved = await user.save();
      return this.userModel.findById(saved._id).populate('role', 'name').select('-password').exec();
    } catch (err) {
      if (err instanceof ForbiddenException ||
          err instanceof BadRequestException ||
          err instanceof ConflictException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async createUser(
    name: string,
    email: string,
    password: string,
    roleName: string,
  ): Promise<User> {
    try {
      const existing = await this.userModel.findOne({ email });
      if (existing) return existing;

      const role = await this.roleModel.findOne({ name: roleName });
      if (!role) throw new BadRequestException(`Role "${roleName}" not found`);

      const hashed = await bcrypt.hash(password, 10);
      const user = new this.userModel({ name, email, password: hashed, role: role._id, isActive: true });
      return user.save();
    } catch (err) {
      return mapMongoError(err, this.logger);
    }
  }

  async findAll(currentUser: any): Promise<User[]> {
    try {
      if (currentUser.role !== 'Admin') {
        throw new ForbiddenException('Only Admin can list users');
      }
      return this.userModel.find().populate('role', 'name').select('-password').exec();
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async findOne(id: string, currentUser: any): Promise<User> {
    try {
      const user = await this.userModel
        .findById(id)
        .populate('role', 'name')
        .select('-password')
        .exec();

      if (!user) throw new NotFoundException('User not found');

      if (currentUser.role !== 'Admin' && currentUser.userId !== user.id) {
        throw new ForbiddenException('You can only view your own profile');
      }
      return user;
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async update(id: string, dto: UpdateUserDto, currentUser: any): Promise<User> {
    try {
      const user = await this.userModel.findById(id);
      if (!user) throw new NotFoundException('User not found');

      if (currentUser.role !== 'Admin' && currentUser.userId !== user.id) {
        throw new ForbiddenException('You can only update your own account');
      }

      if ((dto as any).role) {
        const roleExists = await this.roleModel.findById((dto as any).role);
        if (!roleExists) throw new BadRequestException('Invalid role ID');
      }

      if (dto.password) {
        (dto as any).password = await bcrypt.hash(dto.password, 10);
      }

      Object.assign(user, dto);
      await user.save();
      return this.userModel.findById(id).populate('role', 'name').select('-password').exec();
    } catch (err) {
      if (err instanceof NotFoundException ||
          err instanceof ForbiddenException ||
          err instanceof BadRequestException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async remove(id: string, currentUser: any): Promise<void> {
    try {
      if (currentUser.role !== 'Admin') {
        throw new ForbiddenException('Only Admin can delete users');
      }
      await this.userModel.findByIdAndDelete(id);
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return this.userModel.findOne({ email }).populate('role', 'name').exec();
    } catch (err) {
      return mapMongoError(err, this.logger);
    }
  }
}
