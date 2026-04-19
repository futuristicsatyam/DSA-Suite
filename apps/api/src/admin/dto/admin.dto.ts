import {
  IsString, IsOptional, IsEnum, IsBoolean,
  IsNumber, IsArray, MinLength, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType, CourseType, Difficulty } from '@prisma/client';

// ── Course DTOs ───────────────────────────────────────────────────────────────

export class CreateCourseDto {
  @ApiProperty({ example: 'Data Structures & Algorithms' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'dsa' })
  @IsString()
  @MinLength(1)
  slug: string;

  @ApiPropertyOptional({ enum: CourseType, example: 'COURSE' })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @ApiPropertyOptional({ example: 'Master DSA from basics to advanced' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'BookOpen' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ example: 'Enroll Now' })
  @IsOptional()
  @IsString()
  ctaText?: string;

  @ApiPropertyOptional({ example: 'https://example.com/enroll' })
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dsThumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dsCtaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dsCtaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  algoThumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  algoCtaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  algoCtaUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ctaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dsThumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dsCtaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dsCtaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  algoThumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  algoCtaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  algoCtaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

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

  @ApiProperty({ example: 'course-id' })
  @IsString()
  courseId: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

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

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  includeCodeEditor?: boolean;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeCodeEditor?: boolean;
}

// ── User role DTO ─────────────────────────────────────────────────────────────

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'ADMIN', enum: ['USER', 'ADMIN'] })
  @IsEnum(['USER', 'ADMIN'])
  role: 'USER' | 'ADMIN';
}

// ── PracticeCategory DTOs ─────────────────────────────────────────────────────

export class CreatePracticeCategoryDto {
  @ApiProperty({ example: 'Practice DSA Questions' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'practice-dsa' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: 'Practice DSA problems by topic and difficulty' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Code' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdatePracticeCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ enum: CategoryType })
  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

// ── Problem DTOs ──────────────────────────────────────────────────────────────

export class CreateProblemDto {
  @ApiProperty()
  @IsString()
  topicId: string;

  @ApiProperty({ example: 'Two Sum' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ example: 'two-sum' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiProperty({ example: 'Given an array of integers...' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiPropertyOptional({ example: '1 <= nums.length <= 10^4' })
  @IsOptional()
  @IsString()
  constraints?: string;

  @ApiPropertyOptional({ example: ['Use a hashmap'] })
  @IsOptional()
  @IsArray()
  hints?: string[];

  @ApiPropertyOptional({ example: ['array', 'hashmap'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  timeLimit?: number;

  @ApiPropertyOptional({ example: 256 })
  @IsOptional()
  @IsNumber()
  @Min(16)
  @Max(512)
  memoryLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateProblemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  constraints?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  hints?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  timeLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(16)
  @Max(512)
  memoryLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class CreateTestCaseDto {
  @ApiProperty()
  @IsString()
  problemId: string;

  @ApiProperty({ example: '2 7 11 15\n9' })
  @IsString()
  input: string;

  @ApiProperty({ example: '0 1' })
  @IsString()
  expected: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdateTestCaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  input?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expected?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}
