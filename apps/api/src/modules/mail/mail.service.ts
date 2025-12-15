import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { getVerificationEmailTemplate } from './templates/verification.template'
import { getWelcomeEmailTemplate } from './templates/welcome.template'

const APP_NAME = 'PsyApp'

export interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name)
  private sesClient: SESClient | null = null
  private senderEmail: string

  constructor(private readonly configService: ConfigService) {
    this.senderEmail = this.configService.get<string>('SENDER_EMAIL', 'noreply@example.com')
  }

  onModuleInit() {
    const awsRegion = this.configService.get<string>('AWS_REGION')
    const awsAccessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID')
    const awsSecretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY')

    if (awsAccessKeyId && awsSecretAccessKey && awsRegion) {
      try {
        this.sesClient = new SESClient({
          region: awsRegion,
          credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
          },
        })
        this.logger.log('✅ AWS SES client initialized successfully')
      } catch (error) {
        this.logger.error('❌ Failed to initialize AWS SES client', error)
      }
    } else {
      this.logger.warn('⚠️ AWS credentials not provided, email service will use mock mode')
    }
  }

  /**
   * Отправляет email через AWS SES
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, text, html } = options

    // Mock режим - просто выводим в консоль
    if (!this.sesClient) {
      this.logger.log('📧 MOCK EMAIL SENT:')
      this.logger.log(`   To: ${to}`)
      this.logger.log(`   Subject: ${subject}`)
      this.logger.log(`   Body: ${text.substring(0, 100)}...`)
      return true
    }

    try {
      const command = new SendEmailCommand({
        Source: this.senderEmail,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Text: { Data: text },
            Html: { Data: html || text },
          },
        },
      })

      const response = await this.sesClient.send(command)
      this.logger.log(`✅ Email sent successfully: ${response.MessageId}`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`❌ Failed to send email: ${message}`)
      return false
    }
  }

  /**
   * Отправляет письмо для подтверждения email
   */
  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    baseUrl?: string,
  ): Promise<boolean> {
    const url = baseUrl || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')
    const verificationUrl = `${url}/verify-email?token=${verificationToken}`

    const { subject, text, html } = getVerificationEmailTemplate({
      verificationUrl,
    })

    return this.sendEmail({ to, subject, text, html })
  }

  /**
   * Отправляет приветственное письмо после подтверждения email
   */
  async sendWelcomeEmail(to: string): Promise<boolean> {
    const { subject, text, html } = getWelcomeEmailTemplate()

    return this.sendEmail({ to, subject, text, html })
  }

  /**
   * Отправляет письмо для сброса пароля
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    baseUrl?: string,
  ): Promise<boolean> {
    const url = baseUrl || this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')
    const resetUrl = `${url}/reset-password?token=${resetToken}&email=${to}`

    const subject = `Сброс пароля в ${APP_NAME}`

    const text = `
Здравствуйте!

Вы запросили сброс пароля в ${APP_NAME}. Для создания нового пароля перейдите по ссылке:

${resetUrl}

Ссылка действительна в течение 1 часа.

Если вы не запрашивали сброс пароля, проигнорируйте это письмо.

С уважением,
Команда ${APP_NAME}
    `.trim()

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Сброс пароля</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e74c3c;">Сброс пароля</h2>
        
        <p>Здравствуйте!</p>
        
        <p>Вы запросили сброс пароля в <strong>${APP_NAME}</strong>. Для создания нового пароля нажмите на кнопку ниже:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Сбросить пароль
            </a>
        </div>
        
        <p>Или скопируйте эту ссылку в браузер:</p>
        <p style="word-break: break-all; color: #7f8c8d;">${resetUrl}</p>
        
        <p style="font-size: 14px; color: #7f8c8d;">Ссылка действительна в течение 1 часа.</p>
        
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #7f8c8d;">
            Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
        </p>
        
        <p style="font-size: 14px; color: #7f8c8d;">
            С уважением,<br>
            Команда ${APP_NAME}
        </p>
    </div>
</body>
</html>
    `

    return this.sendEmail({ to, subject, text, html })
  }
}
