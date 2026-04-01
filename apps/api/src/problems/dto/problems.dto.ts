import {
  IsString, IsOptional, IsEnum, IsBoolean,
  IsArray, MinLength, Min, Max, IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty } from '@prisma/client';

export class CreateProblemDto {
  @ApiProperty() @IsString() topicId: string;
  @ApiProperty({ example: 'Two Sum' }) @IsString() @MinLength(2) title: string;
  @ApiProperty({ example: 'two-sum' }) @IsString() @MinLength(2) slug: string;
  @ApiProperty({ example: '# Two Sum\n\nGiven an array...' }) @IsString() @MinLength(10) description: string;
  @ApiProperty({ enum: Difficulty }) @IsEnum(Difficulty) difficulty: Difficulty;
  @ApiPropertyOptional() @IsOptional() @IsString() constraints?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() hints?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @IsInt() @Min(1) @Max(10) timeLimit?: number;
  @ApiPropertyOptional({ example: 256 }) @IsOptional() @IsInt() memoryLimit?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() orderIndex?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() published?: boolean;
}

export class UpdateProblemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: Difficulty }) @IsOptional() @IsEnum(Difficulty) difficulty?: Difficulty;
  @ApiPropertyOptional() @IsOptional() @IsString() constraints?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() hints?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() timeLimit?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() memoryLimit?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() orderIndex?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() published?: boolean;
}

export class CreateTestCaseDto {
  @ApiProperty() @IsString() problemId: string;
  @ApiProperty({ example: '4\n2 7 11 15\n9' }) @IsString() input: string;
  @ApiProperty({ example: '0 1' }) @IsString() expected: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isHidden?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() orderIndex?: number;
}

export class UpdateTestCaseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() input?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() expected?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHidden?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() orderIndex?: number;
}

export class SubmitCodeDto {
  @ApiProperty() @IsString() problemId: string;
  @ApiProperty({ example: 'cpp', enum: ['c', 'cpp', 'java', 'python'] }) @IsString() language: string;
  @ApiProperty({ example: '#include <bits/stdc++.h>\n...' }) @IsString() @MinLength(1) code: string;
}
