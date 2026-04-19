import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateCourseDto, UpdateCourseDto,
  CreateSubjectDto, UpdateSubjectDto,
  CreateTopicDto, UpdateTopicDto,
  CreateEditorialDto, UpdateEditorialDto,
  CreatePracticeCategoryDto, UpdatePracticeCategoryDto,
  CreateProblemDto, UpdateProblemDto,
  CreateTestCaseDto, UpdateTestCaseDto,
} from './dto/admin.dto';
import { CategoryType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const [totalUsers, totalCourses, totalSubjects, totalTopics, totalEditorials, publishedEditorials, totalProblems, publishedProblems] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.course.count(),
        this.prisma.subject.count(),
        this.prisma.topic.count(),
        this.prisma.editorial.count(),
        this.prisma.editorial.count({ where: { published: true } }),
        this.prisma.problem.count(),
        this.prisma.problem.count({ where: { published: true } }),
      ]);

    return { totalUsers, totalCourses, totalSubjects, totalTopics, totalEditorials, publishedEditorials, totalProblems, publishedProblems };
  }

  // ── Courses ───────────────────────────────────────────────────────────────
  async getCourses() {
    const courses = await this.prisma.course.findMany({
      where: { type: 'COURSE' },
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { subjects: true, enrollments: true } } },
    });
    return {
      data: courses.map(c => ({ ...c, subjectsCount: c._count.subjects, enrollmentsCount: c._count.enrollments })),
      total: courses.length,
    };
  }

  async createCourse(dto: CreateCourseDto) {
    const existing = await this.prisma.course.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`A course/language with slug "${dto.slug}" already exists`);
    return this.prisma.course.create({ data: { ...dto, type: 'COURSE' } });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async deleteCourse(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted' };
  }

  // ── Languages ─────────────────────────────────────────────────────────────
  async getLanguages() {
    const languages = await this.prisma.course.findMany({
      where: { type: 'LANGUAGE' },
      orderBy: { orderIndex: 'asc' },
      include: { _count: { select: { subjects: true, enrollments: true } } },
    });
    return {
      data: languages.map(c => ({ ...c, subjectsCount: c._count.subjects, enrollmentsCount: c._count.enrollments })),
      total: languages.length,
    };
  }

  async createLanguage(dto: CreateCourseDto) {
    const existing = await this.prisma.course.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`A course/language with slug "${dto.slug}" already exists`);
    return this.prisma.course.create({ data: { ...dto, type: 'LANGUAGE' } });
  }

  async updateLanguage(id: string, dto: UpdateCourseDto) {
    const lang = await this.prisma.course.findUnique({ where: { id } });
    if (!lang) throw new NotFoundException('Language not found');
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async deleteLanguage(id: string) {
    const lang = await this.prisma.course.findUnique({ where: { id } });
    if (!lang) throw new NotFoundException('Language not found');
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Language deleted' };
  }

  // ── Subjects ──────────────────────────────────────────────────────────────
  async getSubjects(categoryType?: CategoryType) {
    const subjects = await this.prisma.subject.findMany({
      where: categoryType ? { categoryType } : undefined,
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        course: { select: { id: true, name: true } },
        _count: { select: { topics: true } },
      },
    });

    return {
      data: subjects.map(s => ({ ...s, topicsCount: s._count.topics })),
      total: subjects.length,
    };
  }

  async createSubject(dto: CreateSubjectDto) {
    return this.prisma.subject.create({ data: dto });
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    await this.findSubjectOrThrow(id);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async deleteSubject(id: string) {
    await this.findSubjectOrThrow(id);
    await this.prisma.subject.delete({ where: { id } });
    return { message: 'Subject deleted' };
  }

  private async findSubjectOrThrow(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  // ── Topics ────────────────────────────────────────────────────────────────
  async getTopics(subjectId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = subjectId ? { subjectId } : {};

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where,
        orderBy: [{ subjectId: 'asc' }, { orderIndex: 'asc' }],
        include: {
          subject: { select: { name: true, categoryType: true } },
          _count: { select: { bookmarks: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.topic.count({ where }),
    ]);

    return {
      data: topics,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTopic(dto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: dto,
      include: { subject: true },
    });
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    await this.findTopicOrThrow(id);
    return this.prisma.topic.update({
      where: { id },
      data: dto,
      include: { subject: true },
    });
  }

  async deleteTopic(id: string) {
    await this.findTopicOrThrow(id);
    await this.prisma.topic.delete({ where: { id } });
    return { message: 'Topic deleted' };
  }

  private async findTopicOrThrow(id: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  // ── Editorials ────────────────────────────────────────────────────────────
  async getEditorials(published?: boolean, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = published !== undefined ? { published } : {};

    const [editorials, total] = await Promise.all([
      this.prisma.editorial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          topic: { select: { title: true, slug: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.editorial.count({ where }),
    ]);

    return {
      data: editorials,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEditorial(id: string) {
    const editorial = await this.prisma.editorial.findUnique({
      where: { id },
      include: { topic: true },
    });
    if (!editorial) throw new NotFoundException('Editorial not found');
    return editorial;
  }

  async createEditorial(dto: CreateEditorialDto) {
    return this.prisma.editorial.create({
      data: {
        topicId: dto.topicId,
        slug: dto.slug,
        title: dto.title,
        summary: dto.summary,
        markdownContent: dto.markdownContent,
        tags: dto.tags ?? [],
        estimatedMinutes: dto.estimatedMinutes,
        published: dto.published ?? false,
        includeCodeEditor: dto.includeCodeEditor ?? false,
      },
      include: { topic: true },
    });
  }

  async updateEditorial(id: string, dto: UpdateEditorialDto) {
    await this.findEditorialOrThrow(id);
    return this.prisma.editorial.update({
      where: { id },
      data: dto,
      include: { topic: true },
    });
  }

  async deleteEditorial(id: string) {
    await this.findEditorialOrThrow(id);
    await this.prisma.editorial.delete({ where: { id } });
    return { message: 'Editorial deleted' };
  }

  private async findEditorialOrThrow(id: string) {
    const editorial = await this.prisma.editorial.findUnique({ where: { id } });
    if (!editorial) throw new NotFoundException('Editorial not found');
    return editorial;
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  async getUsers(search?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, phone: true,
          emailVerified: true, phoneVerified: true,
          role: true, createdAt: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: {
        id: true, name: true, email: true,
        role: true, updatedAt: true,
      },
    });
  }

  // ── Practice Categories ───────────────────────────────────────────────────
  async getPracticeCategories() {
    const categories = await this.prisma.practiceCategory.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    return { data: categories, total: categories.length };
  }

  async createPracticeCategory(dto: CreatePracticeCategoryDto) {
    return this.prisma.practiceCategory.create({ data: dto });
  }

  async updatePracticeCategory(id: string, dto: UpdatePracticeCategoryDto) {
    const cat = await this.prisma.practiceCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Practice category not found');
    return this.prisma.practiceCategory.update({ where: { id }, data: dto });
  }

  async deletePracticeCategory(id: string) {
    const cat = await this.prisma.practiceCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Practice category not found');
    await this.prisma.practiceCategory.delete({ where: { id } });
    return { message: 'Practice category deleted' };
  }

  // ── Problems ──────────────────────────────────────────────────────────────
  async getProblems(topicId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = topicId ? { topicId } : {};

    const [problems, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          topic: { select: { title: true, slug: true, subject: { select: { name: true, categoryType: true } } } },
          _count: { select: { testCases: true, submissions: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.problem.count({ where }),
    ]);

    return {
      data: problems.map(p => ({
        ...p,
        testCasesCount: p._count.testCases,
        submissionsCount: p._count.submissions,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProblem(id: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, title: true, slug: true } },
        testCases: { orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }

  async createProblem(dto: CreateProblemDto) {
    return this.prisma.problem.create({
      data: {
        topicId: dto.topicId,
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        difficulty: dto.difficulty,
        constraints: dto.constraints,
        hints: dto.hints ?? [],
        tags: dto.tags ?? [],
        timeLimit: dto.timeLimit ?? 2,
        memoryLimit: dto.memoryLimit ?? 256,
        orderIndex: dto.orderIndex,
        published: dto.published ?? false,
      },
      include: { topic: true },
    });
  }

  async updateProblem(id: string, dto: UpdateProblemDto) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    return this.prisma.problem.update({
      where: { id },
      data: dto,
      include: { topic: true },
    });
  }

  async deleteProblem(id: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    await this.prisma.problem.delete({ where: { id } });
    return { message: 'Problem deleted' };
  }

  // ── Test Cases ────────────────────────────────────────────────────────────
  async getTestCases(problemId: string) {
    return this.prisma.testCase.findMany({
      where: { problemId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async createTestCase(dto: CreateTestCaseDto) {
    return this.prisma.testCase.create({ data: dto });
  }

  async updateTestCase(id: string, dto: UpdateTestCaseDto) {
    const tc = await this.prisma.testCase.findUnique({ where: { id } });
    if (!tc) throw new NotFoundException('Test case not found');
    return this.prisma.testCase.update({ where: { id }, data: dto });
  }

  async deleteTestCase(id: string) {
    const tc = await this.prisma.testCase.findUnique({ where: { id } });
    if (!tc) throw new NotFoundException('Test case not found');
    await this.prisma.testCase.delete({ where: { id } });
    return { message: 'Test case deleted' };
  }
}
