import { IsString, IsEmail, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailOtpDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email: string;
}

export class SendPhoneOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'Phone must be a valid number with country code',
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'alex@example.com or +919876543210' })
  @IsString()
  target: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/, { message: 'OTP must be numeric' })
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'alex@example.com',
    description: 'Email or phone number',
  })
  @IsString()
  identifier: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'alex@example.com or +919876543210' })
  @IsString()
  target: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/, { message: 'OTP must be numeric' })
  code: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsString()
  @Matches(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'Must contain at least one number' })
  newPassword: string;
}
