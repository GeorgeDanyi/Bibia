/**
 * Email sending utility using Nodemailer
 */

import nodemailer from 'nodemailer'

// Create transporter from environment variables
function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      'SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in your .env.local file.'
    )
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  await transporter.sendMail({
    from: from,
    to: email,
    subject: 'Obnova hesla - BIBIA',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d5e4c 0%, #1b8a70 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Obnova hesla</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Dostali jsme žádost o obnovu hesla pro váš účet.
            </p>
            <p style="font-size: 16px; margin-bottom: 30px;">
              Klikněte na tlačítko níže pro obnovu hesla. Odkaz je platný 30 minut.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d5e4c 0%, #1b8a70 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Obnovit heslo
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Pokud jste o obnovu hesla nežádali, můžete tento email ignorovat.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
              Nebo zkopírujte tento odkaz do prohlížeče:<br>
              <a href="${resetUrl}" style="color: #0d5e4c; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Obnova hesla - BIBIA

Dostali jsme žádost o obnovu hesla pro váš účet.

Klikněte na odkaz níže pro obnovu hesla. Odkaz je platný 30 minut.

${resetUrl}

Pokud jste o obnovu hesla nežádali, můžete tento email ignorovat.
    `.trim(),
  })
}

/**
 * Send therapist application notification email
 */
export async function sendTherapistApplicationNotification(data: {
  email: string
  phone: string
  fullName: string | null
  city: string | null
  isCertified: boolean
  isInTraining: boolean
  howDidYouHear: string | null
  note: string | null
}): Promise<void> {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  const to = process.env.THERAPIST_LEADS_NOTIFY_TO

  if (!to) {
    throw new Error("THERAPIST_LEADS_NOTIFY_TO environment variable is not set")
  }

  const summary = `
Email: ${data.email}
Telefon: ${data.phone}
${data.fullName ? `Jméno: ${data.fullName}` : ""}
${data.city ? `Město: ${data.city}` : ""}
Osvědčení: ${data.isCertified ? "Ano" : "Ne"}
Studuje: ${data.isInTraining ? "Ano" : "Ne"}
${data.howDidYouHear ? `Jak se dozvěděl/a: ${data.howDidYouHear}` : ""}
${data.note ? `Poznámka: ${data.note}` : ""}
  `.trim()

  await transporter.sendMail({
    from: from,
    to: to,
    subject: "Nová přihláška terapeuta - BIBIA",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d5e4c 0%, #1b8a70 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nová přihláška terapeuta</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; font-size: 14px; line-height: 1.8;">
${summary}
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Nová přihláška terapeuta - BIBIA\n\n${summary}`,
  })
}

