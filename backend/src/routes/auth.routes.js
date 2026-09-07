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
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      throw new BadRequestException('Please provide a valid email format');
    }
    if (!body.password) {
      throw new BadRequestException('Password is required');
    }
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @Bind(Request())
  getProfile(req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @Bind(Request(), Body())
  async changePassword(req, body) {
    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }
    return this.authService.changePassword(req.user.id, body.newPassword);
  }

  @Post('reset-password')
  @Bind(Body())
  async resetPassword(body) {
    const { email, oldPassword, newPassword } = body;
    if (!newPassword || newPassword.length < 6) throw new BadRequestException('New password must be at least 6 characters');
    
    // Validate old password first
    const user = await this.authService.validateUser(email, oldPassword);
    if (!user) throw new UnauthorizedException('Invalid current password or email');
    
    return this.authService.changePassword(user.id, newPassword);
  }
}

