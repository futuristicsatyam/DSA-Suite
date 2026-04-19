import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  CreateCourseDto, UpdateCourseDto,
  CreateSubjectDto, UpdateSubjectDto,
  CreateTopicDto, UpdateTopicDto,
  CreateEditorialDto, UpdateEditorialDto,
  UpdateUserRoleDto,
  CreatePracticeCategoryDto, UpdatePracticeCategoryDto,
  CreateProblemDto, UpdateProblemDto,
  CreateTestCaseDto, UpdateTestCaseDto,
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

  // ── Courses ───────────────────────────────────────────────────────────────
  @Get('courses')
  @ApiOperation({ summary: 'Get all courses' })
  getCourses() {
    return this.adminService.getCourses();
  }

  @Post('courses')
  @ApiOperation({ summary: 'Create a course' })
  createCourse(@Body() dto: CreateCourseDto) {
    return this.adminService.createCourse(dto);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Update a course' })
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.adminService.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a course' })
  deleteCourse(@Param('id') id: string) {
    return this.adminService.deleteCourse(id);
  }

  // ── Languages ─────────────────────────────────────────────────────────────
  @Get('languages')
  @ApiOperation({ summary: 'Get all languages' })
  getLanguages() {
    return this.adminService.getLanguages();
  }

  @Post('languages')
  @ApiOperation({ summary: 'Create a language' })
  createLanguage(@Body() dto: CreateCourseDto) {
    return this.adminService.createLanguage(dto);
  }

  @Patch('languages/:id')
  @ApiOperation({ summary: 'Update a language' })
  updateLanguage(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.adminService.updateLanguage(id, dto);
  }

  @Delete('languages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a language' })
  deleteLanguage(@Param('id') id: string) {
    return this.adminService.deleteLanguage(id);
  }

  // ── Subjects ──────────────────────────────────────────────────────────────
  @Get('subjects')
  @ApiOperation({ summary: 'Get all subjects' })
  @ApiQuery({ name: 'categoryType', required: false, enum: CategoryType })
  getSubjects(@Query('categoryType') categoryType?: CategoryType) {
    // Subjects are few (< 30) — no pagination needed
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
  @ApiOperation({ summary: 'Get all topics (paginated)' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  getTopics(
    @Query('subjectId') subjectId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTopics(subjectId, Number(page) || 1, Number(limit) || 20);
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
  @ApiOperation({ summary: 'Get all editorials (paginated)' })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  getEditorials(
    @Query('published') published?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pub = published === undefined ? undefined : published === 'true';
    return this.adminService.getEditorials(pub, Number(page) || 1, Number(limit) || 20);
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
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  getUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(search, Number(page) || 1, Number(limit) || 20);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  // ── Practice Categories ───────────────────────────────────────────────────
  @Get('practice-categories')
  @ApiOperation({ summary: 'Get all practice categories' })
  getPracticeCategories() {
    return this.adminService.getPracticeCategories();
  }

  @Post('practice-categories')
  @ApiOperation({ summary: 'Create a practice category' })
  createPracticeCategory(@Body() dto: CreatePracticeCategoryDto) {
    return this.adminService.createPracticeCategory(dto);
  }

  @Patch('practice-categories/:id')
  @ApiOperation({ summary: 'Update a practice category' })
  updatePracticeCategory(@Param('id') id: string, @Body() dto: UpdatePracticeCategoryDto) {
    return this.adminService.updatePracticeCategory(id, dto);
  }

  @Delete('practice-categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a practice category' })
  deletePracticeCategory(@Param('id') id: string) {
    return this.adminService.deletePracticeCategory(id);
  }

  // ── Problems ──────────────────────────────────────────────────────────────
  @Get('problems')
  @ApiOperation({ summary: 'Get all problems (paginated)' })
  @ApiQuery({ name: 'topicId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  getProblems(
    @Query('topicId') topicId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getProblems(topicId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('problems/:id')
  @ApiOperation({ summary: 'Get problem by ID with test cases' })
  getProblem(@Param('id') id: string) {
    return this.adminService.getProblem(id);
  }

  @Post('problems')
  @ApiOperation({ summary: 'Create a problem' })
  createProblem(@Body() dto: CreateProblemDto) {
    return this.adminService.createProblem(dto);
  }

  @Patch('problems/:id')
  @ApiOperation({ summary: 'Update a problem' })
  updateProblem(@Param('id') id: string, @Body() dto: UpdateProblemDto) {
    return this.adminService.updateProblem(id, dto);
  }

  @Delete('problems/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a problem' })
  deleteProblem(@Param('id') id: string) {
    return this.adminService.deleteProblem(id);
  }

  // ── Test Cases ────────────────────────────────────────────────────────────
  @Get('problems/:problemId/test-cases')
  @ApiOperation({ summary: 'Get test cases for a problem' })
  getTestCases(@Param('problemId') problemId: string) {
    return this.adminService.getTestCases(problemId);
  }

  @Post('test-cases')
  @ApiOperation({ summary: 'Create a test case' })
  createTestCase(@Body() dto: CreateTestCaseDto) {
    return this.adminService.createTestCase(dto);
  }

  @Patch('test-cases/:id')
  @ApiOperation({ summary: 'Update a test case' })
  updateTestCase(@Param('id') id: string, @Body() dto: UpdateTestCaseDto) {
    return this.adminService.updateTestCase(id, dto);
  }

  @Delete('test-cases/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a test case' })
  deleteTestCase(@Param('id') id: string) {
    return this.adminService.deleteTestCase(id);
  }
}
