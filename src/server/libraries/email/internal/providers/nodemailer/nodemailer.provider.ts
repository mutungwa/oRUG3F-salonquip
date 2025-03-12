import * as NodemailerSDK from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import { EmailSender } from '../../email.type'
import { EmailTemplateService } from '../../templates/email.template.service'
import { Provider, SendOptions } from '../provider'

export class NodemailerProvider implements Provider {
  private client: Mail
  private templateService = new EmailTemplateService()

  constructor() {
    this.initialise()
  }

  private initialise() {
    try {
      this.client = NodemailerSDK.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })

      console.log('Nodemailer is active with Gmail')
    } catch (error) {
      console.error(`Nodemailer failed to start: ${error.message}`)
    }
  }

  async send(options: SendOptions): Promise<void> {
    const from = EmailSender.default
    const content = this.templateService.get(options)

    for (const to of options.to) {
      await this.client.sendMail({
        from: `${from.name} <${from.email}>`,
        to: to.email,
        subject: options.subject,
        html: content,
      })
        .then(result => {
          console.log(`Email sent`)
        })
        .catch(error => {
          console.error(`Could not send email: ${error.message}`)
        })
    }
  }
}
