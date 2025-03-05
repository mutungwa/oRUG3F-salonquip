import { Resend } from 'resend';
import { EmailSender, EmailType } from '../../email.type';
import { EmailTemplateService } from '../../templates/email.template.service';
import { Provider, SendOptions } from '../provider';

export class ResendProvider implements Provider {
  private client: Resend;
  private templateService = new EmailTemplateService();
  private isInitialized: boolean = false;

  constructor() {
    console.log('Initializing Resend Provider:', {
      environment: process.env.NODE_ENV,
      hasApiKey: !!process.env.SERVER_EMAIL_RESEND_API_KEY,
    });
    this.initialise();
  }

  private initialise(): void {
    try {
      const apiKey = process.env.SERVER_EMAIL_RESEND_API_KEY;

      if (!apiKey) {
        throw new Error(
          'Missing Resend credentials. Ensure SERVER_EMAIL_RESEND_API_KEY is set.'
        );
      }

      this.client = new Resend(apiKey);
      this.isInitialized = true;
      console.log(`Resend service successfully initialized in ${process.env.NODE_ENV} mode`);
    } catch (error) {
      this.isInitialized = false;
      console.error('Resend initialization failed:', {
        error: error.message,
        stack: error.stack,
        environment: process.env.NODE_ENV
      });
      throw error;
    }
  }

  async send(options: SendOptions): Promise<void> {
    try {
      if (!this.isInitialized || !this.client) {
        throw new Error('Resend client not properly initialized');
      }

      this.validateSendOptions(options);
      const message = await this.buildMessage(options);

      this.logSendAttempt(options);

      const response = await this.client.emails.send(message);

      if (response.error) {
        throw new Error(response.error.message);
      }

      this.logSendSuccess(options, response);
    } catch (error) {
      this.logSendError(options, error);
      throw error;
    }
  }

  private validateSendOptions(options: SendOptions): void {
    if (!options.to || options.to.length === 0) {
      throw new Error('No recipients specified');
    }
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
  }

  private async buildMessage(options: SendOptions): Promise<{
    from: string;
    to: string[];
    subject: string;
    html: string;
    headers?: Record<string, string>;
  }> {
    try {
      const from = `${EmailSender.default.name} <${EmailSender.default.email}>`;
      const to = options.to.map(recipient => recipient.email);
      const subject = this.buildSubject(options.subject);
      const html = await this.getEmailContent(options);

      return {
        from,
        to,
        subject,
        html,
        headers: {
          'X-Environment': process.env.NODE_ENV,
        }
      };
    } catch (error) {
      console.error('Error building email message:', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  private buildSubject(subject: string): string {
    return process.env.NODE_ENV === 'development' 
      ? `[DEV] ${subject}`
      : subject;
  }

  private async getEmailContent(options: SendOptions): Promise<string> {
    const content = this.templateService.get(options);
    return process.env.NODE_ENV === 'development'
      ? this.wrapWithDevIndicator(content)
      : content;
  }

  private wrapWithDevIndicator(content: string): string {
    return `
      <div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px;">
        Development Mode Email - ${new Date().toISOString()}
      </div>
      ${content}
    `;
  }

  private logSendAttempt(options: SendOptions): void {
    console.log('Attempting to send email:', {
      to: options.to.map(recipient => recipient.email),
      subject: options.subject,
      type: options.type,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }

  private logSendSuccess(options: SendOptions, response: any): void {
    console.log('Email sent successfully:', {
      to: options.to.map(recipient => recipient.email),
      subject: options.subject,
      messageId: response.id,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }

  private logSendError(options: SendOptions, error: any): void {
    console.error('Email sending failed:', {
      error: error.message,
      errorDetails: error.response?.body,
      to: options.to.map(recipient => recipient.email),
      subject: options.subject,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }
} 