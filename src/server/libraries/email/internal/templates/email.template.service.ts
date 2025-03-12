import { FileHelper } from '@/core/helpers/file'
import { EmailType } from '../email.type'
import { SendOptions } from '../providers/provider'
import { Components } from './components'
import path from 'path'
import fs from 'fs'

export class EmailTemplateService {
  private getTemplatePath() {
    // Use __dirname to get the current directory path
    return path.join(process.cwd(), 'src', 'server', 'libraries', 'email', 'internal', 'templates');
  }

  private mapping: Record<EmailType, string> = {
    [EmailType.AUTHORIZATION_VERIFICATION_CODE]:
      'authorization-verification-code',
    [EmailType.AUTHENTICATION_WELCOME]: 'authentication-welcome',
    [EmailType.AUTHENTICATION_FORGOT_PASSWORD]:
      'authentication-forgot-password',
    [EmailType.DEFAULT]: 'default',
  }

  get(options: SendOptions): string {
    const values = options.variables ?? { content: options.content }
    const templatePath = this.getTemplatePath();

    try {
      const pathBase = path.join(templatePath, 'base.html');
      const pathCSS = path.join(templatePath, 'style.css');
      const pathTemplate = path.join(templatePath, `${this.mapping[options.type]}.template.html`);

      const contentBase = fs.readFileSync(pathBase, 'utf-8');
      const contentCSS = fs.readFileSync(pathCSS, 'utf-8');
      const contentTemplate = fs.readFileSync(pathTemplate, 'utf-8');

      let content = this.buildContent(contentTemplate, values)
      content = this.buildContent(contentBase, { style: contentCSS, content })
      content = this.buildComponents(content)

      return content
    } catch (error) {
      console.error('Error reading template files:', error);
      // Fallback to a basic email template if files cannot be read
      return `
        <html>
          <body>
            <h1>${options.subject}</h1>
            <p>${options.content || 'Please check your account for updates.'}</p>
          </body>
        </html>
      `;
    }
  }

  private buildContent(content: string, values: Record<string, string>): string {
    return Object.entries(values).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value)
    }, content)
  }

  private buildComponents(content: string): string {
    return Object.entries(Components).reduce((acc, [key, value]) => {
      return acc.replace(
        new RegExp(`<${key}>(.*?)<\/${key}>`, 'gs'),
        value.replace('{{content}}', '$1'),
      )
    }, content)
  }
}
