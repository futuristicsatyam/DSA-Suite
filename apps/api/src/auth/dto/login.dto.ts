import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'alex@example.com',
    description: 'Email address or phone number',
  })
  @IsString()
  @MinLength(1)
  identifier: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(1)
  password: string;
}
