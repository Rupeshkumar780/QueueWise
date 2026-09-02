import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password;

  @IsOptional()
  @IsEnum(['CUSTOMER', 'BUSINESS_ADMIN', 'STAFF'])
  role;
}

