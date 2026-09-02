import { Controller, Post, Body, UnauthorizedException, BadRequestException, Get, Request, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/auth')
@Dependencies(AuthService)
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Post('register')
  @Bind(Body())
  async register(body) {
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      throw new BadRequestException('Please provide a valid email address');
    }
    if (!body.password || body.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    if (!body.name) {
      throw new BadRequestException('Name is required');
    }
    return this.authService.register(body);
  }

  @Post('login')
  @Bind(Body())
  async login(body) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @Bind(Request())
  getProfile(req) {
    return req.user;
  }
}

