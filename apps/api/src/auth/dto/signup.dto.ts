import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Alex Kumar' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'Phone must be a valid number with country code',
  })
  phone: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'Must contain at least one number' })
  password: string;
}
