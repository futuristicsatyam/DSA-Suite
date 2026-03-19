import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto, ChangePasswordDto, UpdateProgressDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const [allProgress, recentlyViewed, bookmarks, totalTopics, recommendations] =
      await Promise.all([
        this.prisma.userProgress.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          include: { topic: { include: { subject: true } } },
        }),
        this.prisma.recentlyViewed.findMany({
          where: { userId },
          orderBy: { viewedAt: 'desc' },
          take: 5,
          include: { topic: { include: { subject: true } } },
        }),
        this.prisma.bookmark.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { topic: { include: { subject: true } } },
        }),
        this.prisma.topic.count(),
        this.prisma.topic.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { subject: true },
        }),
      ]);

    const completedCount = allProgress.filter(p => p.completed).length;
    const percent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

    // Continue learning = recently viewed topics (in progress or completed)
    const continueLearning = allProgress
      .filter(p => p.progressPercent > 0 && !p.completed)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    // Weekly activity
    const now = new Date();
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - i));
      return { date: date.toISOString().slice(0, 10), count: 0 };
    });

    for (const item of recentlyViewed) {
      const day = item.viewedAt.toISOString().slice(0, 10);
      const found = weeklyActivity.find((e) => e.date === day);
      if (found) found.count += 1;
    }
    for (const item of allProgress) {
      const day = item.updatedAt.toISOString().slice(0, 10);
      const found = weeklyActivity.find((e) => e.date === day);
      if (found) found.count += 1;
    }

    // Streak calculation
    const streak = this.calculateStreak(allProgress, recentlyViewed);

    return {
      continueLearning,
      recentlyViewed,
      bookmarks,
      progressSummary: { completedCount, totalTopics, percent },
      streak,
      weeklyActivity,
      recommendations,
    };
  }

  private calculateStreak(progress: any[], recentlyViewed: any[]): number {
    const activityDates = new Set<string>();

    for (const p of progress) {
      activityDates.add(p.updatedAt.toISOString().slice(0, 10));
    }
    for (const r of recentlyViewed) {
      activityDates.add(r.viewedAt.toISOString().slice(0, 10));
    }

    if (activityDates.size === 0) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      if (activityDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (!dto.name || dto.name.trim().length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name.trim() },
      select: {
        id: true, name: true, email: true, phone: true,
        emailVerified: true, phoneVerified: true, role: true,
        createdAt: true, updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }

  async getBookmarks(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { topic: { include: { subject: true } }, editorial: true },
    });
  }

  async addBookmark(userId: string, topicId?: string, editorialId?: string) {
    if (topicId) {
      const existing = await this.prisma.bookmark.findUnique({
        where: { userId_topicId: { userId, topicId } },
      });
      if (existing) return existing;
    }
    return this.prisma.bookmark.create({
      data: { userId, topicId, editorialId },
      include: { topic: { include: { subject: true } } },
    });
  }

  async removeBookmark(userId: string, bookmarkId: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId },
    });
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    await this.prisma.bookmark.delete({ where: { id: bookmarkId } });
    return { message: 'Bookmark removed' };
  }

  async getProgress(userId: string) {
    return this.prisma.userProgress.findMany({
      where: { userId },
      orderBy: { lastViewedAt: 'desc' },
      include: { topic: { include: { subject: true } } },
    });
  }

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const completed = dto.completed ?? dto.progressPercent === 100;
    return this.prisma.userProgress.upsert({
      where: { userId_topicId: { userId, topicId: dto.topicId } },
      update: { progressPercent: dto.progressPercent, completed, lastViewedAt: new Date() },
      create: { userId, topicId: dto.topicId, progressPercent: dto.progressPercent, completed },
    });
  }

  async getRecentlyViewed(userId: string) {
    return this.prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 10,
      include: { topic: { include: { subject: true } } },
    });
  }

  async addRecentlyViewed(userId: string, topicId: string) {
    return this.prisma.recentlyViewed.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: { viewedAt: new Date() },
      create: { userId, topicId },
    });
  }
}
