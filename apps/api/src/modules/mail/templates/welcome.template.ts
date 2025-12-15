interface EmailTemplate {
  subject: string
  text: string
  html: string
}

const APP_NAME = 'PsyApp'

export function getWelcomeEmailTemplate(): EmailTemplate {
  const subject = `Добро пожаловать в ${APP_NAME}!`

  const text = `
Здравствуйте!

Добро пожаловать в ${APP_NAME}! Ваш email успешно подтвержден.

Теперь вы можете войти в систему и начать работу.

С уважением,
Команда ${APP_NAME}
  `.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Добро пожаловать</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #27ae60;">Добро пожаловать!</h2>
        
        <p>Здравствуйте!</p>
        
        <p>Добро пожаловать в <strong>${APP_NAME}</strong>! Ваш email успешно подтвержден.</p>
        
        <p>Теперь вы можете войти в систему и начать работу.</p>
        
        <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
        
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
