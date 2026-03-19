import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/otp.dto';
import { OtpType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });

    return { accessToken, refreshToken };
  }

  private setCookies(res: Response, refreshToken: string) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const sameSite = this.config.get('COOKIE_SAME_SITE') ?? 'lax';

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd || this.config.get('COOKIE_SECURE') === 'true',
      sameSite: sameSite as 'none' | 'lax' | 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: this.config.get('COOKIE_DOMAIN') || undefined,
    });
  }

  private clearCookies(res: Response) {
    res.clearCookie('refresh_token', { path: '/' });
  }

  private safeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // ── Signup ────────────────────────────────────────────────────────────────

  async signup(dto: SignupDto, res: Response) {
    // Check duplicates
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
      },
    });

    const { accessToken, refreshToken } = this.getTokens(
      user.id,
      user.email,
      user.role,
    );

    this.setCookies(res, refreshToken);

    return { accessToken, user: this.safeUser(user) };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, res: Response) {
    const isEmail = dto.identifier.includes('@');

    const user = await this.prisma.user.findFirst({
      where: isEmail
        ? { email: dto.identifier }
        : { phone: dto.identifier },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.getTokens(
      user.id,
      user.email,
      user.role,
    );

    this.setCookies(res, refreshToken);

    return { accessToken, user: this.safeUser(user) };
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  async refresh(userId: string, email: string, role: string, res: Response) {
    const { accessToken, refreshToken } = this.getTokens(userId, email, role);
    this.setCookies(res, refreshToken);
    return { accessToken };
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(res: Response) {
    this.clearCookies(res);
    return { message: 'Logged out successfully' };
  }

  // ── Me ────────────────────────────────────────────────────────────────────

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  // ── Send Email OTP ────────────────────────────────────────────────────────

  async sendEmailOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        target: email,
        type: OtpType.EMAIL_VERIFY,
        code,
        expiresAt,
      },
    });

    // In production: send via Nodemailer/SendGrid
    // For now: log to console
    console.log(`📧 Email OTP for ${email}: ${code}`);

    return { message: 'OTP sent to email' };
  }

  // ── Verify Email OTP ──────────────────────────────────────────────────────

  async verifyEmailOtp(target: string, code: string) {
    const otp = await this.prisma.otp.findFirst({
      where: {
        target,
        code,
        type: OtpType.EMAIL_VERIFY,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    if (otp.userId) {
      await this.prisma.user.update({
        where: { id: otp.userId },
        data: { emailVerified: true },
      });
    }

    return { message: 'Email verified successfully' };
  }

  // ── Send Phone OTP ────────────────────────────────────────────────────────

  async sendPhoneOtp(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundException('User not found');

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        target: phone,
        type: OtpType.PHONE_VERIFY,
        code,
        expiresAt,
      },
    });

    // In production: send via Twilio/MSG91
    console.log(`📱 Phone OTP for ${phone}: ${code}`);

    return { message: 'OTP sent to phone' };
  }

  // ── Verify Phone OTP ──────────────────────────────────────────────────────

  async verifyPhoneOtp(target: string, code: string) {
    const otp = await this.prisma.otp.findFirst({
      where: {
        target,
        code,
        type: OtpType.PHONE_VERIFY,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    if (otp.userId) {
      await this.prisma.user.update({
        where: { id: otp.userId },
        data: { phoneVerified: true },
      });
    }

    return { message: 'Phone verified successfully' };
  }

  // ── Forgot Password ───────────────────────────────────────────────────────

  async forgotPassword(identifier: string) {
    const isEmail = identifier.includes('@');

    const user = await this.prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user) throw new NotFoundException('No account found');

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const target = isEmail ? user.email : user.phone;

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        target,
        type: OtpType.RESET_PASSWORD,
        code,
        expiresAt,
      },
    });

    console.log(`🔑 Reset OTP for ${target}: ${code}`);

    return { message: 'Reset code sent' };
  }

  // ── Reset Password ────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const otp = await this.prisma.otp.findFirst({
      where: {
        target: dto.target,
        code: dto.code,
        type: OtpType.RESET_PASSWORD,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    if (otp.userId) {
      const newHash = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.user.update({
        where: { id: otp.userId },
        data: { passwordHash: newHash },
      });
    }

    return { message: 'Password reset successfully' };
  }
}
