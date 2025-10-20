import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly jwtExpiresIn: string;

  constructor(private readonly config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET not defined in .env');

    const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '15m';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });

    this.jwtExpiresIn = expiresIn;
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub || !payload?.email) {
      this.logger.warn('Invalid JWT payload detected');
      throw new UnauthorizedException('Invalid token payload');
    }

    if (payload.tokenType !== 'access') {
      this.logger.warn(`Rejected ${payload.tokenType} token for ${payload.email}`);
      throw new UnauthorizedException('Access token required');
    }

    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expDate = new Date(payload.exp * 1000).toISOString();

      if (payload.exp < now) {
        this.logger.warn(`Expired token for ${payload.email} (expired at ${expDate})`);
        throw new UnauthorizedException('Token has expired');
      }

      this.logger.debug(
        `✅ Token valid for ${payload.email} | Expires: ${expDate} | Lifetime: ${this.jwtExpiresIn}`,
      );
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
