import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: AppConfigService) {
    const emailConfig = this.configService.email;

    this.transporter = createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
  }

  async sendVerificationEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const emailConfig = this.configService.email;
    const verificationUrl = `${this.configService.app.allowedOrigins[0]}/verify-email?token=${token}`;

    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
      text: `Please visit the following link to verify your email address: ${verificationUrl}. This link will expire in 24 hours.`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const emailConfig = this.configService.email;
    const resetUrl = `${this.configService.app.allowedOrigins[0]}/reset-password?token=${token}`;

    const mailOptions = {
      from: emailConfig.from,
      to: email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `,
      text: `Please visit the following link to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw new Error('Failed to send password reset email');
    }
  }
}

