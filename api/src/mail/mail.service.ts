import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  private async sendMailSafely(
    action: () => Promise<unknown>,
    purpose: string,
  ) {
    try {
      await action();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown mail error';
      this.logger.error(`Failed to send ${purpose}: ${message}`);
      throw new InternalServerErrorException(
        'Unable to send email. Check MAIL_HOST, MAIL_PORT, MAIL_USER, and MAIL_PASSWORD in your server environment (Hostinger hPanel → Environment variables).',
      );
    }
  }

  async sendEmailVerificationOtp(to: string, name: string, otp: string) {
    await this.sendMailSafely(
      () =>
        this.mailerService.sendMail({
          to,
          subject: 'Verify your ConfidenceUp account',
          template: 'email-otp',
          context: { name, otp, type: 'verify your email address' },
        }),
      'verification OTP',
    );
  }

  async sendPasswordResetOtp(to: string, name: string, otp: string) {
    await this.sendMailSafely(
      () =>
        this.mailerService.sendMail({
          to,
          subject: 'Reset your ConfidenceUp password',
          template: 'email-otp',
          context: { name, otp, type: 'reset your password' },
        }),
      'password reset OTP',
    );
  }

  async sendWelcomeEmail(to: string, name: string) {
    await this.sendMailSafely(
      () =>
        this.mailerService.sendMail({
          to,
          subject: 'Welcome to ConfidenceUp!',
          template: 'welcome',
          context: { name },
        }),
      'welcome email',
    );
  }

  async sendAccountDeletionWarning(
    to: string,
    name: string,
    deletionDate: Date,
  ) {
    await this.sendMailSafely(
      () =>
        this.mailerService.sendMail({
          to,
          subject: 'Your ConfidenceUp account deletion is scheduled',
          template: 'account-deletion',
          context: {
            name,
            deletionDate: deletionDate.toLocaleDateString(),
          },
        }),
      'account deletion warning',
    );
  }

  async sendWeeklyReport(
    to: string,
    name: string,
    data: {
      sessionsCount: number;
      avgConfidence: number;
      bestScore: number;
      streak: number;
      topDimension: string;
    },
  ) {
    await this.sendMailSafely(
      () =>
        this.mailerService.sendMail({
          to,
          subject: 'Your weekly ConfidenceUp report',
          template: 'weekly-report',
          context: { name, ...data },
        }),
      'weekly report',
    );
  }

  async sendContactInquiry(dto: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    const subjectLabels: Record<string, string> = {
      general: 'General inquiry',
      support: 'Support',
      partnership: 'Partnership',
      press: 'Press & media',
    };

    const label = subjectLabels[dto.subject] ?? dto.subject;

    await this.sendMailSafely(
      () =>
        this.mailerService.sendMail({
          to: 'info@thinkfeat.com',
          replyTo: dto.email,
          subject: `[ConfidenceUp Contact] ${label} — ${dto.name}`,
          html: `
            <p><strong>Name:</strong> ${dto.name}</p>
            <p><strong>Email:</strong> ${dto.email}</p>
            <p><strong>Subject:</strong> ${label}</p>
            <p><strong>Message:</strong></p>
            <p>${dto.message.replace(/\n/g, '<br>')}</p>
          `,
        }),
      'contact inquiry',
    );
  }
}
