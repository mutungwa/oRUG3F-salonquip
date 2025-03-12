import { FileHelper } from '@/core/helpers/file'
import { EmailType } from '../email.type'
import { SendOptions } from '../providers/provider'
import { Components } from './components'
import path from 'path'
import fs from 'fs'

export class EmailTemplateService {
  private getTemplatePath(): string {
    // In production, templates are in the .next/server directory
    if (process.env.NODE_ENV === 'production') {
      return path.join(process.cwd(), '.next', 'server', 'src', 'server', 'libraries', 'email', 'internal', 'templates');
    }
    // In development, use the source directory
    return path.join(process.cwd(), 'src', 'server', 'libraries', 'email', 'internal', 'templates');
  }

  private mapping: Record<EmailType, string> = {
    [EmailType.AUTHORIZATION_VERIFICATION_CODE]: 'authorization-verification-code',
    [EmailType.AUTHENTICATION_WELCOME]: 'authentication-welcome',
    [EmailType.AUTHENTICATION_FORGOT_PASSWORD]: 'authentication-forgot-password',
    [EmailType.DEFAULT]: 'default',
  }

  get(options: SendOptions): string {
    const values = options.variables ?? { content: options.content }
    const templatePath = this.getTemplatePath()

    try {
      // Read all required template files
      const pathBase = path.join(templatePath, 'base.html')
      const pathCSS = path.join(templatePath, 'style.css')
      const pathTemplate = path.join(templatePath, `${this.mapping[options.type]}.template.html`)

      console.log('Template paths:', {
        base: pathBase,
        css: pathCSS,
        template: pathTemplate,
        exists: {
          base: fs.existsSync(pathBase),
          css: fs.existsSync(pathCSS),
          template: fs.existsSync(pathTemplate)
        }
      });

      const contentBase = fs.readFileSync(pathBase, 'utf-8')
      const contentCSS = fs.readFileSync(pathCSS, 'utf-8')
      const contentTemplate = fs.readFileSync(pathTemplate, 'utf-8')

      // Build the email content
      let content = this.buildContent(contentTemplate, values)
      content = this.buildContent(contentBase, { style: contentCSS, content })
      content = this.buildComponents(content)

      return content
    } catch (error) {
      console.error('Error reading template files:', {
        error,
        templatePath,
        type: options.type,
        mapping: this.mapping[options.type]
      })
      throw new Error(`Failed to load email template: ${error.message}`)
    }
  }

  private buildContent(content: string, values: Record<string, string>): string {
    return Object.entries(values).reduce((acc, [key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      return acc.replace(regex, value)
    }, content)
  }

  private buildComponents(content: string): string {
    return Object.entries(Components).reduce((acc, [key, value]) => {
      const regex = new RegExp(`<${key}[^>]*>([\\s\\S]*?)<\\/${key}>`, 'g')
      return acc.replace(regex, (_, inner) => value(inner))
    }, content)
  }
}
