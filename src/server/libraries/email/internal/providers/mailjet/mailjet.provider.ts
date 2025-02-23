import Mailjet from 'node-mailjet'
import { EmailSender, EmailType } from '../../email.type'
import { EmailTemplateService } from '../../templates/email.template.service'
import { Provider, SendOptions } from '../provider'

export class MailjetProvider implements Provider {
  private client: Mailjet
  private templateService = new EmailTemplateService()

  private templateIds: Record<EmailType, number> = {
    [EmailType.DEFAULT]: null,
    [EmailType.AUTHENTICATION_WELCOME]: null,
    [EmailType.AUTHENTICATION_FORGOT_PASSWORD]: null,
    [EmailType.AUTHORIZATION_VERIFICATION_CODE]: null,
  }

  constructor() {
    this.initialise()
  }

  private initialise(): void {
    try {
      const apiKey = process.env.SERVER_EMAIL_MAILJET_API_KEY
      const secretKey = process.env.SERVER_EMAIL_MAILJET_SECRET_KEY

      if (!apiKey || !secretKey) {
        console.warn(
          `Set SERVER_EMAIL_MAILJET_API_KEY and SERVER_EMAIL_MAILJET_SECRET_KEY to activate Mailjet`,
        )
        return
      }

      this.client = new Mailjet({ apiKey, apiSecret: secretKey })

      console.log(`Mailjet service active in ${process.env.NODE_ENV} mode`)
    } catch (error) {
      console.error(`Could not start Mailjet service`)
      console.error(error)
    }
  }

  async send(options: SendOptions): Promise<void> {
    if (!this.client) {
      console.error('Mailjet client not initialized')
      return
    }

    const message = this.buildMessage(options)

    // Add development mode logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending email:', {
        to: options.to,
        subject: options.subject,
        type: options.type
      })
    }

    return this.client
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            ...message,
          },
        ],
      })
      .then(result => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Email sent successfully:', {
            to: options.to,
            subject: options.subject,
            result: result.body
          })
        } else {
          console.log(`Emails sent`, result)
        }
      })
      .catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Email sending failed:', {
            error: error.message,
            statusCode: error.statusCode,
            to: options.to,
            subject: options.subject
          })
        } else {
          console.error(`Could not send emails (${error.statusCode})`)
        }
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
  } {
    const from = {
      Email: EmailSender.default.email,
      Name: EmailSender.default.name,
    }

    const to = options.to.map(item => ({ Email: item.email, Name: item.name }))

    // Add [DEV] prefix to subject in development mode
    const subject = process.env.NODE_ENV === 'development' 
      ? `[DEV] ${options.subject}`
      : options.subject

    const message = {
      From: from,
      To: to,
      Subject: subject,
      HTMLPart: undefined,
      Variables: undefined,
      TemplateLanguage: undefined,
      templateId: undefined,
    }

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

      // Add development mode indicator to non-template emails
      if (process.env.NODE_ENV === 'development') {
        message.HTMLPart = `
          <div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px;">
            Development Mode Email
          </div>
          ${content}
        `
      } else {
        message.HTMLPart = content
      }
    }

    return message
  }
}