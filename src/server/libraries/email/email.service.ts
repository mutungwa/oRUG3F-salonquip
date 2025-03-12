import { EmailType } from './internal/email.type'
import { NodemailerProvider } from './internal/providers/nodemailer/nodemailer.provider'
import { ResendProvider } from './internal/providers/resend/resend.provider'
import { Provider } from './internal/providers/provider'

type SendOptions = {
  name: string
  email: string
  subject: string
  type: EmailType
  content?: string
  variables: Record<string, string>
}

export class Service {
  private provider: Provider

  public Type = EmailType

  constructor() {
    this.provider = new NodemailerProvider()
  }

  async send(options: SendOptions): Promise<void> {
    return this.provider
      .send({
        type: options.type,
        content: options.content,
        to: [
          {
            name: options.name,
            email: options.email,
          },
        ],
        variables: options.variables,
        subject: options.subject,
      })
      .then(() => {
        console.log(`Email sent to ${options.email}`, options)
      })
  }
}

export const EmailService = new Service()
