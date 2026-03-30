import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateSubjectDto, UpdateSubjectDto,
  CreateTopicDto, UpdateTopicDto,
  CreateEditorialDto, UpdateEditorialDto,
} from './dto/admin.dto';
import { CategoryType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const [totalUsers, totalSubjects, totalTopics, totalEditorials, publishedEditorials] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.subject.count(),
        this.prisma.topic.count(),
        this.prisma.editorial.count(),
        this.prisma.editorial.count({ where: { published: true } }),
      ]);

    return { totalUsers, totalSubjects, totalTopics, totalEditorials, publishedEditorials };
  }

  // ── Subjects ──────────────────────────────────────────────────────────────
  async getSubjects(categoryType?: CategoryType) {
    const subjects = await this.prisma.subject.findMany({
      where: categoryType ? { categoryType } : undefined,
      orderBy: [{ categoryType: 'asc' }, { orderIndex: 'asc' }],
      include: { _count: { select: { topics: true } } },
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
}
