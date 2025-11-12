import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../services/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from '../dto/login.dto';
import { AuthTokensDto } from '../interfaces/auth';
import { InvalidCredentialsException } from '../shared/exception/auth.exception';
import { JwtPayload } from '../interfaces/jwt.payload';
import { RegisterDto, RegisterResponseDto } from 'src/dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    return this.generateTokens(user);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<{
    id: string;
    email: string;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const { ...result } = user;
        return { ...result, id: result.id.toString() };
      }
    }

    return null;
  }

  private async generateTokens(user: {
    id: string;
    email: string;
  }): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password, name } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (!this.isPasswordStrong(password)) {
      throw new BadRequestException(
        'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
      );
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      return {
        id: user.id.toString(),
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt.toISOString(),
        message: 'User registered successfully',
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new BadRequestException('Failed to create user account');
    }
  }

  private isPasswordStrong(password: string): boolean {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }
}
