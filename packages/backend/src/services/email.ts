import { Resend } from 'resend'
import env from '../env'

const resend = new Resend(env.resendApiKey)

async function sendEmail(to: string, subject: string, html: string) {
    try {
        const response = await resend.emails.send({
            from: env.emailFrom,
            to,
            subject,
            html,
        })
        return response
    } catch (error) {
        console.error(error)
        throw error
    }
}

export async function sendVerificationEmail(to: string, code: string) {
    const subject = '[Shieldly] OTP Verification'
    const html = `
    <p>We're thrilled to have you join our community!</p>
    <p>To get started, please verify your email address using the code below:</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${code}</span>
    </div>
    <p>If you didn't request this verification, please ignore this email.</p>
    <p>Thank you for choosing Shieldly!</p>
    <p>The Shieldly Team</p>
    `
    await sendEmail(to, subject, html)
}

export default sendEmail
