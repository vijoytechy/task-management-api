import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body, @Res({ passthrough: true }) res: Response) {
    try {
      const data = LoginSchema.parse(body);
      const user = await this.authService.validateUser(data.email, data.password);
      const tokens = await this.authService.login(user);

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh',
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
      });

      return { access_token: tokens.access_token, user: tokens.user };
    } catch (err) {
      throw new BadRequestException(err.errors || err.message);
    }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'];
    if (!token) throw new UnauthorizedException('Missing refresh token');

    const tokens = await this.authService.refresh(token);

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    return { access_token: tokens.access_token };
  }

  //  Public logout (no guard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'strict',
    });
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Req() req) {
    return this.authService.getProfile(req.user);
  }
}
