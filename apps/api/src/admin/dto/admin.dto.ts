import {
  IsString, IsOptional, IsEnum, IsBoolean,
  IsNumber, IsArray, MinLength, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType, Difficulty } from '@prisma/client';

// ── Subject DTOs ──────────────────────────────────────────────────────────────

export class CreateSubjectDto {
  @ApiProperty({ example: 'Arrays' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'arrays' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: 'The most fundamental data structure' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  categoryType: CategoryType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

// ── Topic DTOs ────────────────────────────────────────────────────────────────

export class CreateTopicDto {
  @ApiProperty()
  @IsString()
  subjectId: string;

  @ApiProperty({ example: 'Introduction to Arrays' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ example: 'arrays-intro' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdateTopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

// ── Editorial DTOs ────────────────────────────────────────────────────────────

export class CreateEditorialDto {
  @ApiProperty()
  @IsString()
  topicId: string;

  @ApiProperty({ example: 'editorial-arrays-intro' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Introduction to Arrays' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ example: '# Arrays\n\nContent here...' })
  @IsString()
  @MinLength(10)
  markdownContent: string;

  @ApiPropertyOptional({ example: ['arrays', 'basics'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateEditorialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  markdownContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

// ── User role DTO ─────────────────────────────────────────────────────────────

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'ADMIN', enum: ['USER', 'ADMIN'] })
  @IsEnum(['USER', 'ADMIN'])
  role: 'USER' | 'ADMIN';
}
