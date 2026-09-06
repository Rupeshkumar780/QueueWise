import { Injectable, Dependencies, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
@Dependencies(UsersService, JwtService)
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async register(data) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await argon2.hash(data.password);
    const user = await this.usersService.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role === 'BUSINESS_ADMIN' ? 'BUSINESS_ADMIN' : 'CUSTOMER',
    });

    return this.login(user);
  }

  async validateUser(email, pass) {
    const user = await this.usersService.findByEmail(email);
    if (user && await argon2.verify(user.passwordHash, pass)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  async changePassword(userId, newPassword) {
    const passwordHash = await argon2.hash(newPassword);
    await this.usersService.updatePassword(userId, passwordHash);
    return { success: true, message: 'Password updated successfully' };
  }
}


