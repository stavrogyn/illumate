interface VerificationTemplateParams {
  verificationUrl: string
}

interface EmailTemplate {
  subject: string
  text: string
  html: string
}

const APP_NAME = 'PsyApp'

export function getVerificationEmailTemplate(params: VerificationTemplateParams): EmailTemplate {
  const { verificationUrl } = params

  const subject = `Подтверждение регистрации в ${APP_NAME}`

  const text = `
Здравствуйте!

Спасибо за регистрацию в ${APP_NAME}. Для подтверждения вашего email перейдите по ссылке:

${verificationUrl}

Если вы не регистрировались в нашем сервисе, проигнорируйте это письмо.

С уважением,
Команда ${APP_NAME}
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Подтверждение регистрации</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Подтверждение регистрации</h2>
        
        <p>Здравствуйте!</p>
        
        <p>Спасибо за регистрацию в <strong>${APP_NAME}</strong>. Для подтверждения вашего email нажмите на кнопку ниже:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Подтвердить Email
            </a>
        </div>
        
        <p>Или скопируйте эту ссылку в браузер:</p>
        <p style="word-break: break-all; color: #7f8c8d;">${verificationUrl}</p>
        
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #7f8c8d;">
            Если вы не регистрировались в нашем сервисе, проигнорируйте это письмо.
        </p>
        
        <p style="font-size: 14px; color: #7f8c8d;">
            С уважением,<br>
            Команда ${APP_NAME}
        </p>
    </div>
</body>
</html>
  `

  return { subject, text, html }
}
