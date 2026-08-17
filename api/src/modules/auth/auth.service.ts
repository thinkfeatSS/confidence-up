import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { Platform } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  generateReferralCode,
} from '../../common/utils/otp.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ── Register ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const referralCode = generateReferralCode();

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        referralCode,
        streak: { create: {} },
      },
    });

    await this.sendVerificationOtp(user.id, user.email, user.name);

    return { message: 'Registration successful. Check your email for OTP.' };
  }

  // ── Verify Email ───────────────────────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('Email already verified');

    const record = await this.prisma.emailOtp.findFirst({
      where: {
        userId: user.id,
        type: 'VERIFY_EMAIL',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new BadRequestException('OTP expired or not found');

    const valid = await verifyOtp(dto.otp, record.otpHash);
    if (!valid) throw new BadRequestException('Invalid OTP');

    await this.prisma.$transaction([
      this.prisma.emailOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      }),
    ]);

    await this.mailService.sendWelcomeEmail(user.email, user.name);

    return { message: 'Email verified successfully' };
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('Account is suspended');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) throw new UnauthorizedException('Invalid credentials');

    const device = await this.upsertDevice(user.id, dto);
    const tokens = await this.generateTokens(user.id, user.email, user.role, device.id);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ── Google Auth ────────────────────────────────────────────────────────────

  async googleAuth(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }, deviceInfo?: { deviceToken?: string; deviceName?: string; platform?: string; appVersion?: string }) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
          isVerified: true,
          referralCode: generateReferralCode(),
          streak: { create: {} },
        },
      });
      await this.mailService.sendWelcomeEmail(user.email, user.name);
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId, isVerified: true },
      });
    }

    if (user.isBlocked) throw new UnauthorizedException('Account is suspended');

    const device = await this.upsertDevice(user.id, deviceInfo ?? {});
    const tokens = await this.generateTokens(user.id, user.email, user.role, device.id);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async googleMobileAuth(dto: GoogleAuthDto) {
    const clientId = this.configService.get<string>('google.clientId');
    if (!clientId) throw new BadRequestException('Google Sign-In is not configured');

    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid or expired Google token');
    }
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    return this.googleAuth(
      {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email.split('@')[0],
        avatarUrl: payload.picture,
      },
      {
        deviceToken: dto.deviceToken,
        deviceName: dto.deviceName,
        platform: dto.platform,
        appVersion: dto.appVersion,
      },
    );
  }

  // ── Forgot Password ────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, an OTP has been sent.' };

    await this.sendPasswordResetOtp(user.id, user.email, user.name);
    return { message: 'If that email exists, an OTP has been sent.' };
  }

  // ── Reset Password ─────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const record = await this.prisma.emailOtp.findFirst({
      where: {
        userId: user.id,
        type: 'FORGOT_PASSWORD',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new BadRequestException('OTP expired or not found');
    const valid = await verifyOtp(dto.otp, record.otpHash);
    if (!valid) throw new BadRequestException('Invalid OTP');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.emailOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  // ── Refresh Token ──────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; deviceId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = await bcrypt.hash(refreshToken, 1);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        deviceId: payload.deviceId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!stored) throw new UnauthorizedException('Refresh token revoked');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.isBlocked) throw new UnauthorizedException('Account not accessible');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      payload.deviceId,
    );

    void tokenHash; // suppress unused var
    return tokens;
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  async logout(userId: string, deviceId?: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        ...(deviceId ? { deviceId } : {}),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (deviceId) {
      await this.prisma.device.updateMany({
        where: { id: deviceId, userId },
        data: { isActive: false },
      });
    }

    return { message: 'Logged out successfully' };
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  async resendVerificationOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If that email exists, an OTP has been sent.' };
    if (user.isVerified) throw new BadRequestException('Email already verified');

    await this.sendVerificationOtp(user.id, user.email, user.name);
    return { message: 'OTP resent successfully' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async sendVerificationOtp(userId: string, email: string, name: string) {
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailOtp.create({
      data: { userId, otpHash, type: 'VERIFY_EMAIL', expiresAt },
    });
    await this.mailService.sendEmailVerificationOtp(email, name, otp);
  }

  private async sendPasswordResetOtp(userId: string, email: string, name: string) {
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailOtp.create({
      data: { userId, otpHash, type: 'FORGOT_PASSWORD', expiresAt },
    });
    await this.mailService.sendPasswordResetOtp(email, name, otp);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    deviceId: string,
  ) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn') as any,
      }),
      this.jwtService.signAsync(
        { sub: userId, deviceId },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: this.configService.get('jwt.refreshExpiresIn') as any,
        },
      ),
    ]);

    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const days = parseInt(refreshExpiresIn.replace('d', ''), 10) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        deviceId,
        tokenHash: await bcrypt.hash(refreshToken, 6),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private async upsertDevice(
    userId: string,
    dto: {
      deviceToken?: string;
      deviceName?: string;
      platform?: string;
      appVersion?: string;
    },
  ) {
    const platform = (dto.platform as Platform) ?? 'ANDROID';

    const existing = await this.prisma.device.findFirst({
      where: { userId, deviceName: dto.deviceName ?? null, isActive: true },
    });

    if (existing) {
      return this.prisma.device.update({
        where: { id: existing.id },
        data: {
          fcmToken: dto.deviceToken,
          appVersion: dto.appVersion,
          lastSeenAt: new Date(),
        },
      });
    }

    return this.prisma.device.create({
      data: {
        userId,
        fcmToken: dto.deviceToken,
        platform,
        deviceName: dto.deviceName,
        appVersion: dto.appVersion,
      },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }
}
