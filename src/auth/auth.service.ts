import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { mapMongoError } from '../common/utils/mongo-error.util';
import { AccessTokenPayload, JwtPayloadBase, RefreshTokenPayload } from '../common/interfaces/jwt-payload.interface';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private signAccessAndRefreshTokens(base: JwtPayloadBase) {
    const accessPayload: AccessTokenPayload = { ...base, tokenType: 'access' };
    const refreshPayload: RefreshTokenPayload = { ...base, tokenType: 'refresh' };

    const accessExpires =
      (this.configService.get<string>('JWT_EXPIRES_IN') as `${number}${'s'|'m'|'h'|'d'}`) || '15m';
    const refreshExpires =
      (this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') as `${number}${'s'|'m'|'h'|'d'}`) || '7d';

    const access_token = this.jwtService.sign(accessPayload, { expiresIn: accessExpires });
    const refresh_token = this.jwtService.sign(refreshPayload, { expiresIn: refreshExpires });

    return { access_token, refresh_token, accessExpires };
  }

  // mapMongoError now used directly from shared util

  async validateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) throw new UnauthorizedException('Invalid credentials');

      const isMatch = await bcrypt.compare(password, (user as any).password);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');

      return user;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async login(user: User) {
    try {
      const roleName = (user as any)?.role?.name || (user as any)?.role;
      const base: JwtPayloadBase = {
        sub: (user as any)._id?.toString(),
        email: (user as any).email,
        role: roleName,
      };

      const { access_token, refresh_token, accessExpires } =
        this.signAccessAndRefreshTokens(base);

      return {
        access_token,
        refresh_token,
        expires_in: accessExpires,
        user: {
          id: (user as any)._id,
          name: (user as any).name,
          email: (user as any).email,
          role: roleName,
        },
      };
    } catch (err) {
      return mapMongoError(err, this.logger);
    }
  }

  async register(name: string, email: string, password: string, role: string) {
    try {
      const existing = await this.usersService.findByEmail(email);
      if (existing) throw new ConflictException('Email already registered');

      const user = await this.usersService.createUser(name, email, password, role);
      return this.login(user);
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async refresh(refreshToken: string) {
    try {
      const decoded: any = this.jwtService.verify(refreshToken);
      if (decoded?.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) throw new UnauthorizedException('User no longer exists');

      return this.login(user);
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      return mapMongoError(err, this.logger);
    }
  }

  async getProfile(userPayload: any) {
    try {
      const user = await this.usersService.findByEmail(userPayload.email);
      if (!user) throw new UnauthorizedException('User not found');

      const roleName = (user as any)?.role?.name || 'Unknown';
      return {
        id: (user as any)._id,
        name: (user as any).name,
        email: (user as any).email,
        role: roleName,
        createdAt: (user as any).createdAt,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      return mapMongoError(err, this.logger);
    }
  }
}
