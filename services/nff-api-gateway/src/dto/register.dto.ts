import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'password123',
    type: String,
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '1',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
    type: String,
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'User company',
    example: 'Acme Corp',
    type: String,
    required: false,
  })
  company?: string;

  @ApiProperty({
    description: 'Registration timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  createdAt: string;

  @ApiProperty({
    description: 'Success message',
    example: 'User registered successfully',
    type: String,
  })
  message: string;
}
