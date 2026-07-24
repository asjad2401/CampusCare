import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.EMAIL_FROM!

export async function sendOtpEmail(email: string, otp: string, purpose: 'signup' | 'login') {
  const subject = purpose === 'signup'
    ? 'Verify your CampusCare account'
    : 'Your CampusCare login code'

  const action = purpose === 'signup' ? 'activate your account' : 'log in'

  const { error } = await resend.emails.send({
    from: `CampusCare <${FROM}>`,
    to: [email],
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:16px;border:1px solid #2a2a3a;overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center;">
                    <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                      🎓 CampusCare
                    </div>
                    <div style="color:rgba(255,255,255,0.8);margin-top:6px;font-size:14px;">
                      Student Community Fundraising Platform
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 36px;">
                    <p style="color:#a0a0b8;font-size:15px;margin:0 0 24px;">
                      Use this code to ${action}. It expires in <strong style="color:#c4b5fd;">10 minutes</strong>.
                    </p>
                    <div style="background:#1e1e2e;border:1px solid #3b3b5c;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
                      <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#a78bfa;font-family:monospace;">
                        ${otp}
                      </div>
                    </div>
                    <p style="color:#6b6b8a;font-size:13px;margin:0;">
                      If you didn't request this, you can safely ignore this email. Do not share this code with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 36px;border-top:1px solid #2a2a3a;">
                    <p style="color:#4a4a6a;font-size:12px;margin:0;text-align:center;">
                      © ${new Date().getFullYear()} CampusCare · Student Community Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
