import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';

import { EmailService } from './email.service';
import { AppConfigService } from '../../config/app-config.service';

const mockSendMail = jest.fn();
const mockTransporter = {
  sendMail: mockSendMail,
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: {
    email: {
      host: string;
      port: number;
      user: string;
      pass: string;
      from: string;
    };
    app: {
      allowedOrigins: string[];
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
    const mockedNodemailer = nodemailer as {
      createTransport: jest.Mock;
    };
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter);

    const mockConfigService = {
      email: {
        host: 'smtp.example.com',
        port: 587,
        user: 'test@example.com',
        pass: 'password',
        from: 'noreply@example.com',
      },
      app: {
        allowedOrigins: ['http://localhost:3000'],
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(AppConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    const email = 'test@example.com';
    const token = 'verification-token';

    it('should successfully send verification email', async () => {
      await service.sendVerificationEmail(email, token);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: configService.email.from,
          to: email,
          subject: 'Verify your email address',
        }),
      );
    });

    it('should use correct email template', async () => {
      await service.sendVerificationEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      expect(callArgs.html).toContain('Email Verification');
      expect(callArgs.html).toContain('verify your email address');
      expect(callArgs.text).toContain('verify your email address');
    });

    it('should include verification token in email', async () => {
      await service.sendVerificationEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      expect(callArgs.html).toContain(token);
      expect(callArgs.text).toContain(token);
    });

    it('should include verification URL in email', async () => {
      await service.sendVerificationEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      const expectedUrl = `${configService.app.allowedOrigins[0]}/verify-email?token=${token}`;
      expect(callArgs.html).toContain(expectedUrl);
      expect(callArgs.text).toContain(expectedUrl);
    });

    it('should handle email sending errors', async () => {
      const error = new Error('SMTP error');
      mockSendMail.mockRejectedValueOnce(error);

      await expect(service.sendVerificationEmail(email, token)).rejects.toThrow(
        'Failed to send verification email',
      );
    });

    it('should throw error when frontend URL not configured', async () => {
      const moduleWithoutUrl: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: AppConfigService,
            useValue: {
              email: configService.email,
              app: {
                allowedOrigins: [],
              },
            },
          },
        ],
      }).compile();

      const serviceWithoutUrl =
        moduleWithoutUrl.get<EmailService>(EmailService);

      await expect(
        serviceWithoutUrl.sendVerificationEmail(email, token),
      ).rejects.toThrow('Frontend URL not configured');
    });
  });

  describe('sendPasswordResetEmail', () => {
    const email = 'test@example.com';
    const token = 'reset-token';

    it('should successfully send password reset email', async () => {
      await service.sendPasswordResetEmail(email, token);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: configService.email.from,
          to: email,
          subject: 'Reset your password',
        }),
      );
    });

    it('should include reset token in email', async () => {
      await service.sendPasswordResetEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      expect(callArgs.html).toContain(token);
      expect(callArgs.text).toContain(token);
    });

    it('should include reset URL in email', async () => {
      await service.sendPasswordResetEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      const expectedUrl = `${configService.app.allowedOrigins[0]}/reset-password?token=${token}`;
      expect(callArgs.html).toContain(expectedUrl);
      expect(callArgs.text).toContain(expectedUrl);
    });

    it('should handle email sending errors', async () => {
      const error = new Error('SMTP error');
      mockSendMail.mockRejectedValueOnce(error);

      await expect(
        service.sendPasswordResetEmail(email, token),
      ).rejects.toThrow('Failed to send password reset email');
    });

    it('should throw error when frontend URL not configured', async () => {
      const moduleWithoutUrl: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: AppConfigService,
            useValue: {
              email: configService.email,
              app: {
                allowedOrigins: [],
              },
            },
          },
        ],
      }).compile();

      const serviceWithoutUrl =
        moduleWithoutUrl.get<EmailService>(EmailService);

      await expect(
        serviceWithoutUrl.sendPasswordResetEmail(email, token),
      ).rejects.toThrow('Frontend URL not configured');
    });
  });
});
