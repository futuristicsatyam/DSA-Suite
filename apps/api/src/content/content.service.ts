import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CategoryType } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Get published courses ─────────────────────────────────────────────────
  async getCourses() {
    return this.prisma.course.findMany({
      where: { published: true, type: 'COURSE' },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        thumbnail: true,
        ctaText: true,
        ctaUrl: true,
        dsThumbnail: true,
        dsCtaText: true,
        dsCtaUrl: true,
        algoThumbnail: true,
        algoCtaText: true,
        algoCtaUrl: true,
      },
    });
  }

  // ── Get published languages ────────────────────────────────────────────────
  async getLanguages() {
    return this.prisma.course.findMany({
      where: { published: true, type: 'LANGUAGE' },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        thumbnail: true,
        ctaText: true,
        ctaUrl: true,
      },
    });
  }

  // ── Get published practice categories ─────────────────────────────────────
  async getPracticeCategories() {
    return this.prisma.practiceCategory.findMany({
      where: { published: true },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        categoryType: true,
      },
    });
  }

  // ── Get subjects by category ──────────────────────────────────────────────
  async getSubjects(categoryType: CategoryType) {
    return this.prisma.subject.findMany({
      where: { categoryType },
      orderBy: { orderIndex: 'asc' },
      include: {
        topics: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            slug: true,
            title: true,
            shortDescription: true,
            difficulty: true,
            orderIndex: true,
          },
        },
      },
    });
  }

  // ── Get subjects by course slug ───────────────────────────────────────────
  async getSubjectsByCourse(courseSlug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug: courseSlug },
    });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.subject.findMany({
      where: { courseId: course.id },
      orderBy: { orderIndex: 'asc' },
      include: {
        topics: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            slug: true,
            title: true,
            shortDescription: true,
            difficulty: true,
            orderIndex: true,
          },
        },
      },
    });
  }

  // ── Get course by slug ────────────────────────────────────────────────────
  async getCourseBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        thumbnail: true,
        ctaText: true,
        ctaUrl: true,
        dsThumbnail: true,
        dsCtaText: true,
        dsCtaUrl: true,
        algoThumbnail: true,
        algoCtaText: true,
        algoCtaUrl: true,
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  // ── Get topic by slug ─────────────────────────────────────────────────────
  async getTopic(slug: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { slug },
      include: {
        subject: true,
        editorial: true,
      },
    });

    if (!topic) throw new NotFoundException('Topic not found');

    return {
      topic,
      editorial: topic.editorial ?? null,
    };
  }

  // ── Get editorial by slug ─────────────────────────────────────────────────
  async getEditorial(slug: string) {
    const editorial = await this.prisma.editorial.findUnique({
      where: { slug },
      include: { topic: { include: { subject: true } } },
    });

    if (!editorial || !editorial.published) {
      throw new NotFoundException('Editorial not found');
    }

    return editorial;
  }

  // ── Search ────────────────────────────────────────────────────────────────
  async search(q: string) {
    if (!q || q.trim().length < 2) {
      return { subjects: [], topics: [], editorials: [] };
    }

    const term = q.trim().toLowerCase();

    const [subjects, topics, editorials] = await Promise.all([
      this.prisma.subject.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.topic.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { shortDescription: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { subject: true },
      }),
      this.prisma.editorial.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { summary: { contains: term, mode: 'insensitive' } },
            { tags: { has: term } },
          ],
        },
        take: 5,
        include: { topic: true },
      }),
    ]);

    return { subjects, topics, editorials };
  }
}
