import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CategoryType } from '@prisma/client';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ── Courses ────────────────────────────────────────────────────────────────
  @Get('courses')
  @ApiOperation({ summary: 'Get all published courses' })
  getCourses() {
    return this.contentService.getCourses();
  }

  @Get('languages')
  @ApiOperation({ summary: 'Get all published languages' })
  getLanguages() {
    return this.contentService.getLanguages();
  }

  @Get('courses/:slug')
  @ApiOperation({ summary: 'Get course by slug' })
  getCourseBySlug(@Param('slug') slug: string) {
    return this.contentService.getCourseBySlug(slug);
  }

  @Get('courses/:slug/subjects')
  @ApiOperation({ summary: 'Get subjects for a course by slug' })
  getSubjectsByCourse(@Param('slug') slug: string) {
    return this.contentService.getSubjectsByCourse(slug);
  }

  @Get('courses/:slug/topics/:topicSlug')
  @ApiOperation({ summary: 'Get topic by slug for a course' })
  getCourseTopicBySlug(@Param('topicSlug') topicSlug: string) {
    return this.contentService.getTopic(topicSlug);
  }

  // ── Practice Categories ────────────────────────────────────────────────────
  @Get('practice-categories')
  @ApiOperation({ summary: 'Get all published practice categories' })
  getPracticeCategories() {
    return this.contentService.getPracticeCategories();
  }

  // ── DSA ───────────────────────────────────────────────────────────────────
  @Get('dsa/subjects')
  @ApiOperation({ summary: 'Get all DSA subjects with topics' })
  getDsaSubjects() {
    return this.contentService.getSubjects(CategoryType.DSA);
  }

  @Get('dsa/topics/:slug')
  @ApiOperation({ summary: 'Get DSA topic by slug with editorial' })
  getDsaTopic(@Param('slug') slug: string) {
    return this.contentService.getTopic(slug);
  }

  // ── CP ────────────────────────────────────────────────────────────────────
  @Get('cp/subjects')
  @ApiOperation({ summary: 'Get all CP subjects with topics' })
  getCpSubjects() {
    return this.contentService.getSubjects(CategoryType.CP);
  }

  @Get('cp/topics/:slug')
  @ApiOperation({ summary: 'Get CP topic by slug with editorial' })
  getCpTopic(@Param('slug') slug: string) {
    return this.contentService.getTopic(slug);
  }

  // ── GATE ──────────────────────────────────────────────────────────────────
  @Get('gate/subjects')
  @ApiOperation({ summary: 'Get all GATE subjects with topics' })
  getGateSubjects() {
    return this.contentService.getSubjects(CategoryType.GATE);
  }

  @Get('gate/topics/:slug')
  @ApiOperation({ summary: 'Get GATE topic by slug with editorial' })
  getGateTopic(@Param('slug') slug: string) {
    return this.contentService.getTopic(slug);
  }

  // ── Editorial ─────────────────────────────────────────────────────────────
  @Get('editorials/:slug')
  @ApiOperation({ summary: 'Get editorial by slug' })
  getEditorial(@Param('slug') slug: string) {
    return this.contentService.getEditorial(slug);
  }

  // ── Search ────────────────────────────────────────────────────────────────
  @Get('search')
  @ApiOperation({ summary: 'Search topics, subjects and editorials' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  search(@Query('q') q: string) {
    return this.contentService.search(q);
  }
}
