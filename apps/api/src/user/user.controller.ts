import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  AddBookmarkDto,
  UpdateProgressDto,
} from './dto/user.dto';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Get user dashboard data' })
  getDashboard(@Req() req: any) {
    return this.userService.getDashboard(req.user.id);
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  @Patch('profile')
  @ApiOperation({ summary: 'Update profile name' })
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  // ── Password ──────────────────────────────────────────────────────────────
  @Patch('password')
  @ApiOperation({ summary: 'Change password' })
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.id, dto);
  }

  // ── Bookmarks ─────────────────────────────────────────────────────────────
  @Get('bookmarks')
  @ApiOperation({ summary: 'Get all bookmarks' })
  getBookmarks(@Req() req: any) {
    return this.userService.getBookmarks(req.user.id);
  }

  @Post('bookmarks')
  @ApiOperation({ summary: 'Add a bookmark' })
  addBookmark(@Req() req: any, @Body() dto: AddBookmarkDto) {
    return this.userService.addBookmark(req.user.id, dto.topicId, dto.editorialId);
  }

  @Delete('bookmarks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a bookmark' })
  removeBookmark(@Req() req: any, @Param('id') id: string) {
    return this.userService.removeBookmark(req.user.id, id);
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  @Get('progress')
  @ApiOperation({ summary: 'Get user progress' })
  getProgress(@Req() req: any) {
    return this.userService.getProgress(req.user.id);
  }

  @Post('progress')
  @ApiOperation({ summary: 'Update topic progress' })
  updateProgress(@Req() req: any, @Body() dto: UpdateProgressDto) {
    return this.userService.updateProgress(req.user.id, dto);
  }

  // ── Recently viewed ───────────────────────────────────────────────────────
  @Get('recently-viewed')
  @ApiOperation({ summary: 'Get recently viewed topics' })
  getRecentlyViewed(@Req() req: any) {
    return this.userService.getRecentlyViewed(req.user.id);
  }

  @Post('recently-viewed')
  @ApiOperation({ summary: 'Add a recently viewed topic' })
  addRecentlyViewed(@Req() req: any, @Body() body: { topicId: string }) {
    return this.userService.addRecentlyViewed(req.user.id, body.topicId);
  }

  // ── Enrollments ───────────────────────────────────────────────────────────
  @Get('enrollments')
  @ApiOperation({ summary: 'Get enrolled courses with progress' })
  getEnrollments(@Req() req: any) {
    return this.userService.getEnrollments(req.user.id);
  }

  @Post('enrollments')
  @ApiOperation({ summary: 'Enroll in a course' })
  enrollInCourse(@Req() req: any, @Body() body: { courseId: string }) {
    return this.userService.enrollInCourse(req.user.id, body.courseId);
  }

  @Delete('enrollments/:courseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unenroll from a course' })
  unenrollFromCourse(@Req() req: any, @Param('courseId') courseId: string) {
    return this.userService.unenrollFromCourse(req.user.id, courseId);
  }

  @Get('enrollments/:courseId/status')
  @ApiOperation({ summary: 'Check enrollment status' })
  isEnrolled(@Req() req: any, @Param('courseId') courseId: string) {
    return this.userService.isEnrolled(req.user.id, courseId);
  }
}
