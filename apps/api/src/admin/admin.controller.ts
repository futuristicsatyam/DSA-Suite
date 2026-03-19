import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  CreateSubjectDto, UpdateSubjectDto,
  CreateTopicDto, UpdateTopicDto,
  CreateEditorialDto, UpdateEditorialDto,
  UpdateUserRoleDto,
} from './dto/admin.dto';
import { CategoryType } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ─────────────────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  // ── Subjects ──────────────────────────────────────────────────────────────
  @Get('subjects')
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiQuery({ name: 'categoryType', required: false, enum: CategoryType })
  getSubjects(@Query('categoryType') categoryType?: CategoryType) {
    return this.adminService.getSubjects(categoryType);
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Create a subject' })
  createSubject(@Body() dto: CreateSubjectDto) {
    return this.adminService.createSubject(dto);
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: 'Update a subject' })
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.adminService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a subject' })
  deleteSubject(@Param('id') id: string) {
    return this.adminService.deleteSubject(id);
  }

  // ── Topics ────────────────────────────────────────────────────────────────
  @Get('topics')
  @ApiOperation({ summary: 'Get all topics' })
  @ApiQuery({ name: 'subjectId', required: false })
  getTopics(@Query('subjectId') subjectId?: string) {
    return this.adminService.getTopics(subjectId);
  }

  @Post('topics')
  @ApiOperation({ summary: 'Create a topic' })
  createTopic(@Body() dto: CreateTopicDto) {
    return this.adminService.createTopic(dto);
  }

  @Patch('topics/:id')
  @ApiOperation({ summary: 'Update a topic' })
  updateTopic(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.adminService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a topic' })
  deleteTopic(@Param('id') id: string) {
    return this.adminService.deleteTopic(id);
  }

  // ── Editorials ────────────────────────────────────────────────────────────
  @Get('editorials')
  @ApiOperation({ summary: 'Get all editorials' })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  getEditorials(@Query('published') published?: string) {
    const pub = published === undefined ? undefined : published === 'true';
    return this.adminService.getEditorials(pub);
  }

  @Get('editorials/:id')
  @ApiOperation({ summary: 'Get editorial by ID' })
  getEditorial(@Param('id') id: string) {
    return this.adminService.getEditorial(id);
  }

  @Post('editorials')
  @ApiOperation({ summary: 'Create an editorial' })
  createEditorial(@Body() dto: CreateEditorialDto) {
    return this.adminService.createEditorial(dto);
  }

  @Patch('editorials/:id')
  @ApiOperation({ summary: 'Update an editorial' })
  updateEditorial(@Param('id') id: string, @Body() dto: UpdateEditorialDto) {
    return this.adminService.updateEditorial(id, dto);
  }

  @Delete('editorials/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an editorial' })
  deleteEditorial(@Param('id') id: string) {
    return this.adminService.deleteEditorial(id);
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'search', required: false })
  getUsers(@Query('search') search?: string) {
    return this.adminService.getUsers(search);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }
}
