import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Judge0Service } from './judge0.service';
import { SubmitCodeDto } from './dto/problems.dto';
import { Verdict, Difficulty } from '@prisma/client';

@Injectable()
export class ProblemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly judge0: Judge0Service,
  ) {}

  async getProblems(topicId?: string, difficulty?: Difficulty, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { published: true };
    if (topicId) where.topicId = topicId;
    if (difficulty) where.difficulty = difficulty;

    const [data, total] = await Promise.all([
      this.prisma.problem.findMany({
        where, skip, take: limit,
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
        include: {
          topic: { select: { title: true, slug: true, subject: { select: { name: true, categoryType: true } } } },
          _count: { select: { submissions: true, testCases: true } },
        },
      }),
      this.prisma.problem.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getProblemBySlug(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: {
        topic: { include: { subject: true } },
        testCases: { where: { isHidden: false }, orderBy: { orderIndex: 'asc' } },
        _count: { select: { submissions: true, testCases: true } },
      },
    });
    if (!problem || !problem.published) throw new NotFoundException('Problem not found');
    return problem;
  }

  async getProblemsByTopic(topicId: string) {
    return this.prisma.problem.findMany({
      where: { topicId, published: true },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, slug: true, title: true, difficulty: true, orderIndex: true, _count: { select: { submissions: true } } },
    });
  }

  async submitCode(userId: string, dto: SubmitCodeDto) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId },
      include: { testCases: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const submission = await this.prisma.submission.create({
      data: {
        userId, problemId: dto.problemId,
        language: dto.language, code: dto.code,
        testCasesTotal: problem.testCases.length,
      },
    });

    let verdict: Verdict = Verdict.ACCEPTED;
    let passed = 0;
    let maxTime = '0';
    let maxMemory = 0;
    let errorOutput: string | null = null;

    try {
      for (const tc of problem.testCases) {
        const result = await this.judge0.runCode(
          dto.language, dto.code, tc.input,
          problem.timeLimit, problem.memoryLimit,
        );
        const statusId = result.status?.id ?? 0;

        if (this.judge0.isCompilationError(statusId)) {
          verdict = Verdict.COMPILATION_ERROR;
          errorOutput = (result.compile_output || '').trim();
          break;
        }
        if (this.judge0.isTLE(statusId)) {
          verdict = Verdict.TIME_LIMIT_EXCEEDED;
          break;
        }
        if (this.judge0.isRuntimeError(statusId)) {
          verdict = Verdict.RUNTIME_ERROR;
          errorOutput = (result.stderr || '').trim();
          break;
        }

        const stdout = (result.stdout || '').trim().replace(/\r\n/g, '\n');
        const expected = tc.expected.trim().replace(/\r\n/g, '\n');

        if (stdout !== expected) {
          verdict = Verdict.WRONG_ANSWER;
          break;
        }

        passed++;
        if (result.time && parseFloat(result.time) > parseFloat(maxTime)) maxTime = result.time;
        if (result.memory && result.memory > maxMemory) maxMemory = result.memory;

        // Rate limit delay
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err: any) {
      verdict = Verdict.PENDING;
      errorOutput = `Judge0 unreachable: ${err?.message || String(err)}`;
    }

    return this.prisma.submission.update({
      where: { id: submission.id },
      data: { verdict, testCasesPassed: passed, runtime: maxTime, memory: maxMemory, errorOutput },
      select: {
        id: true, verdict: true, runtime: true, memory: true,
        testCasesPassed: true, testCasesTotal: true, errorOutput: true,
        language: true, createdAt: true,
      },
    });
  }

  async getSubmissions(userId: string, slug: string) {
    const problem = await this.prisma.problem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundException('Problem not found');
    return this.prisma.submission.findMany({
      where: { userId, problemId: problem.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, verdict: true, runtime: true, memory: true,
        testCasesPassed: true, testCasesTotal: true,
        language: true, createdAt: true,
      },
    });
  }

  async getSubmissionById(userId: string, id: string) {
    const sub = await this.prisma.submission.findFirst({ where: { id, userId } });
    if (!sub) throw new NotFoundException('Submission not found');
    return sub;
  }

  async getSolvedProblemIds(userId: string) {
    const solved = await this.prisma.submission.findMany({
      where: { userId, verdict: 'ACCEPTED' },
      select: { problemId: true },
      distinct: ['problemId'],
    });
    return solved.map(s => s.problemId);
  }
}
