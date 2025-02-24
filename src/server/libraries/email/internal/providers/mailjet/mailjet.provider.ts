import Mailjet from 'node-mailjet'
import { EmailSender, EmailType } from '../../email.type'
import { EmailTemplateService } from '../../templates/email.template.service'
import { Provider, SendOptions } from '../provider'

export class MailjetProvider implements Provider {
  private client: Mailjet
  private templateService = new EmailTemplateService()
  private isInitialized: boolean = false

  private templateIds: Record<EmailType, number> = {
    [EmailType.DEFAULT]: null,
    [EmailType.AUTHENTICATION_WELCOME]: null,
    [EmailType.AUTHENTICATION_FORGOT_PASSWORD]: null,
    [EmailType.AUTHORIZATION_VERIFICATION_CODE]: null,
  }

  constructor() {
    console.log('Initializing Mailjet Provider:', {
      environment: process.env.NODE_ENV,
      hasApiKey: !!process.env.SERVER_EMAIL_MAILJET_API_KEY,
      hasSecretKey: !!process.env.SERVER_EMAIL_MAILJET_SECRET_KEY
    })
    this.initialise()
  }

  private async initialise(): Promise<void> {
    try {
      const apiKey = process.env.SERVER_EMAIL_MAILJET_API_KEY
      const secretKey = process.env.SERVER_EMAIL_MAILJET_SECRET_KEY

      if (!apiKey || !secretKey) {
        throw new Error(
          'Missing Mailjet credentials. Ensure SERVER_EMAIL_MAILJET_API_KEY and SERVER_EMAIL_MAILJET_SECRET_KEY are set.'
        )
      }

      this.client = new Mailjet({ 
        apiKey, 
        apiSecret: secretKey,
        config: {
          version: 'v3.1'
        }
      })

      // Verify connection
      await this.verifyConnection()

      this.isInitialized = true
      console.log(`Mailjet service successfully initialized in ${process.env.NODE_ENV} mode`)
    } catch (error) {
      this.isInitialized = false
      console.error('Mailjet initialization failed:', {
        error: error.message,
        stack: error.stack,
        environment: process.env.NODE_ENV
      })
      throw error
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.client
        .get('sender')
        .request()
      console.log('Mailjet connection verified successfully')
    } catch (error) {
      console.error('Mailjet connection verification failed:', {
        error: error.message,
        statusCode: error.statusCode
      })
      throw error
    }
  }

  async send(options: SendOptions): Promise<void> {
    try {
      if (!this.isInitialized || !this.client) {
        throw new Error('Mailjet client not properly initialized')
      }

      this.validateSendOptions(options)
      const message = this.buildMessage(options)

      this.logSendAttempt(options)

      const response = await this.client
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [message],
        })

      this.logSendSuccess(options, response)
    } catch (error) {
      this.logSendError(options, error)
      throw error // Re-throw for handling by caller
    }
  }

  private validateSendOptions(options: SendOptions): void {
    if (!options.to || options.to.length === 0) {
      throw new Error('No recipients specified')
    }
    if (!options.subject) {
      throw new Error('Email subject is required')
    }
    // Add more validations as needed
  }

  private logSendAttempt(options: SendOptions): void {
    console.log('Attempting to send email:', {
      to: options.to.map(recipient => recipient.email),
      subject: options.subject,
      type: options.type,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  }

  private logSendSuccess(options: SendOptions, response: any): void {
    console.log('Email sent successfully:', {
      to: options.to.map(recipient => recipient.email),
      subject: options.subject,
      messageId: response.body?.Messages?.[0]?.To?.[0]?.MessageID,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  }

  private logSendError(options: SendOptions, error: any): void {
    console.error('Email sending failed:', {
      error: error.message,
      statusCode: error.statusCode,
      errorDetails: error.response?.body,
      to: options.to.map(recipient => recipient.email),
      subject: options.subject,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  }

  private buildMessage(options: SendOptions): {
    From: { Email: string; Name: string }
    To: { Email: string; Name: string }[]
    Subject: string
    HTMLPart?: string
    Variables?: Record<string, any>
    TemplateLanguage?: boolean
    templateId?: number
    Headers?: Record<string, string>
  } {
    try {
      const from = {
        Email: EmailSender.default.email,
        Name: EmailSender.default.name,
      }

      const to = options.to.map(item => ({ Email: item.email, Name: item.name }))

      const subject = this.buildSubject(options.subject)

      const message = {
        From: from,
        To: to,
        Subject: subject,
        HTMLPart: undefined,
        Variables: undefined,
        TemplateLanguage: undefined,
        templateId: undefined,
        Headers: {
          'X-Environment': process.env.NODE_ENV,
          'X-Message-ID': `${Date.now()}-${Math.random().toString(36).substring(2)}`,
        }
      }

      this.applyTemplate(message, options)

      return message
    } catch (error) {
      console.error('Error building email message:', {
        error: error.message,
        options
      })
      throw error
    }
  }

  private buildSubject(subject: string): string {
    return process.env.NODE_ENV === 'development' 
      ? `[DEV] ${subject}`
      : subject
  }

  private applyTemplate(
    message: any, 
    options: SendOptions
  ): void {
    const templateId = this.templateIds[options.type]

    if (templateId) {
      message.TemplateLanguage = true
      message.templateId = templateId
      message.Variables = {
        ...options.variables,
        environment: process.env.NODE_ENV
      }
    } else {
      const content = this.templateService.get(options)
      message.HTMLPart = process.env.NODE_ENV === 'development'
        ? this.wrapWithDevIndicator(content)
        : content
    }
  }

  private wrapWithDevIndicator(content: string): string {
    return `
      <div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px;">
        Development Mode Email - ${new Date().toISOString()}
      </div>
      ${content}
    `
  }
}