import {
  Controller, Get, Post, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProblemsService } from './problems.service';
import { SubmitCodeDto } from './dto/problems.dto';
import { Difficulty } from '@prisma/client';

@ApiTags('Problems')
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all published problems' })
  @ApiQuery({ name: 'topicId', required: false })
  @ApiQuery({ name: 'difficulty', required: false, enum: Difficulty })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getProblems(
    @Query('topicId') topicId?: string,
    @Query('difficulty') difficulty?: Difficulty,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.problemsService.getProblems(topicId, difficulty, Number(page) || 1, Number(limit) || 20);
  }

  @Get('topic/:topicId')
  @ApiOperation({ summary: 'Get problems for a topic' })
  getProblemsByTopic(@Param('topicId') topicId: string) {
    return this.problemsService.getProblemsByTopic(topicId);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit code for judging' })
  submitCode(@Req() req: any, @Body() dto: SubmitCodeDto) {
    return this.problemsService.submitCode(req.user.id, dto);
  }

  @Get(':slug/submissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my submissions for a problem' })
  getMySubmissions(@Req() req: any, @Param('slug') slug: string) {
    return this.problemsService.getSubmissions(req.user.id, slug);
  }

  @Get('submissions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get submission by ID' })
  getSubmission(@Req() req: any, @Param('id') id: string) {
    return this.problemsService.getSubmissionById(req.user.id, id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get problem by slug with sample test cases' })
  getProblem(@Param('slug') slug: string) {
    return this.problemsService.getProblemBySlug(slug);
  }
}
