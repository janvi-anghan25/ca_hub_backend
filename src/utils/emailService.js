import * as brevo from '@getbrevo/brevo';
import logger from './logger.js';

const LOGO_URL = `${process.env.SERVER_URL || 'http://localhost:8000'}/assets/ca-logo.png`;

let brevoClient = null;
const getBrevoClient = () => {
  if (!brevoClient) {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured.');
    }
    brevoClient = new brevo.BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  }
  return brevoClient;
};


const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F4F7F5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 580px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #D5E3DE;
      box-shadow: 0 8px 24px rgba(15, 47, 42, 0.06);
    }
    .header {
      background-color: #0A0E0D;
      background: linear-gradient(135deg, #0A0E0D 0%, #14181A 55%, #1C2224 100%);
      padding: 24px 28px;
      text-align: left;
      border-bottom: 3px solid #C4A574;
    }
    .header .logo-wrap {
      max-width: 220px;
      margin: 0;
    }
    .header img.logo {
      width: 100%;
      max-width: 220px;
      height: auto;
      display: block;
      border: 0;
      outline: none;
    }
    .body {
      padding: 36px 36px 30px;
      color: #1A2E2A;
    }
    .body h2 {
      font-size: 21px;
      font-weight: 700;
      color: #0F2F2A;
      margin: 0 0 20px;
      letter-spacing: -0.3px;
    }
    .body p {
      color: #3D5A54;
      font-size: 14px;
      line-height: 1.7;
      margin: 0 0 16px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #0F2F2A 0%, #1A4A42 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.2px;
      border: 1px solid #C4A574;
      box-shadow: 0 4px 14px rgba(15, 47, 42, 0.2);
    }
    .token-box {
      background: #F4F7F5;
      border: 2px dashed #C4A574;
      border-radius: 12px;
      padding: 18px 24px;
      text-align: center;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #0F2F2A;
      margin: 24px 0;
      font-family: 'IBM Plex Mono', Courier, monospace;
    }
    .info-card {
      background: #F4F7F5;
      border: 1px solid #D5E3DE;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid #E8EFEB;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #5A7A72;
      font-weight: 500;
    }
    .info-value {
      color: #0F2F2A;
      font-weight: 600;
      font-family: 'IBM Plex Mono', Courier, monospace;
    }
    .divider {
      border: none;
      border-top: 1px solid #E8EFEB;
      margin: 24px 0;
    }
    .note {
      color: #5A7A72 !important;
      font-size: 12.5px !important;
      line-height: 1.6;
    }
    .footer {
      background: #0A221E;
      padding: 20px 32px;
      text-align: center;
      border-top: 1px solid #1A4A42;
    }
    .footer p {
      color: #A8C5BE;
      font-size: 12px;
      margin: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-wrap">
        <img class="logo" src="${LOGO_URL}" alt="CA Hub - Chartered Accountants" width="220" />
      </div>
    </div>
    
    <div class="body">
      ${content}
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} CA Hub Practice Management System.</p>
    </div>
  </div>
</body>
</html>
`;

const emailService = {
  async sendEmail({ to, subject, html }) {
    const fromName = process.env.EMAIL_FROM_NAME || 'CA Hub';
    const fromEmail = process.env.EMAIL_FROM || 'no-reply@yourdomain.com';

    const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));

    try {
      const client = getBrevoClient();
      const result = await client.transactionalEmails.sendTransacEmail({
        sender: { name: fromName, email: fromEmail },
        to: recipients,
        subject,
        htmlContent: html,
      });

      logger.info(`[Brevo] Sent to ${to}: "${subject}" (messageId: ${result?.messageId})`);
      return result;
    } catch (err) {
      const errMsg = err?.body?.message || err.message;
      logger.error(`[Brevo] Error sending to ${to}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  async sendWelcomeEmail(user) {
    const html = baseTemplate(
      'Welcome to CA Hub',
      `
      <h2>Welcome, ${user.name}!</h2>
      <p>Your <strong>CA Hub</strong> account has been successfully created. You can now access your practice dashboard to streamline your client workflows, tasks, GST/ITR compliances, and billing.</p>
      
      <div class="btn-container">
        <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login">Sign In to CA Hub</a>
      </div>

      <div class="info-card">
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td class="info-label">Account Email:</td>
            <td class="info-value" align="right">${user.email}</td>
          </tr>
          <tr>
            <td class="info-label">Assigned Role:</td>
            <td class="info-value" align="right">${user.role}</td>
          </tr>
        </table>
      </div>

      <p class="note">If you did not initiate this account creation, please notify your office administrator immediately.</p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to CA Hub Practice Management',
      html,
    });
  },

  async sendPasswordResetEmail(user, resetToken, resetUrl) {
    const html = baseTemplate(
      'Reset Your CA Hub Password',
      `
      <h2>Password Reset Request</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>We received a request to reset your password for your <strong>CA Hub</strong> account. Click the button below to choose a new password:</p>
      
      <div class="btn-container">
        <a class="btn" href="${resetUrl}">Reset Password</a>
      </div>

      <p class="note" style="text-align: center;">Or copy and paste this link into your browser:<br/>
        <span style="color:#0F2F2A;font-weight:600;font-size:11px;word-break:break-all;">${resetUrl}</span>
      </p>

      <hr class="divider" />
      <p class="note">⏱ <strong>Notice:</strong> This reset link will expire in <strong>10 minutes</strong>.</p>
      <p class="note">🔒 If you did not request this, you can safely ignore this email — your credentials remain secure.</p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request — CA Hub',
      html,
    });
  },

  async sendPasswordResetOTPEmail(user, otp) {
    const html = baseTemplate(
      'Password Reset OTP — CA Hub',
      `
      <h2>Password Reset OTP</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Use the secure one-time verification code below to reset your CA Hub account password:</p>
      
      <div class="token-box">${otp}</div>

      <p class="note" style="text-align: center;">⏱ This verification code is valid for <strong>10 minutes</strong>.</p>
      <hr class="divider" />
      <p class="note">🔒 <strong>Security Warning:</strong> Never share this code with anyone. CA Hub support will never ask for your OTP.</p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Your Password Reset OTP — CA Hub',
      html,
    });
  },

  async sendAdminInviteEmail(user, temporaryPassword, officeName) {
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
    const html = baseTemplate(
      'Your CA Office Admin Account',
      `
      <h2>Administrator Invitation</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>A Super Admin has set up a CA Office Admin account for you${officeName ? ` at <strong>${officeName}</strong>` : ''}.</p>
      <p>Here are your temporary login credentials:</p>
      
      <div class="info-card">
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td class="info-label">Login Email:</td>
            <td class="info-value" align="right">${user.email}</td>
          </tr>
          <tr>
            <td class="info-label">Temporary Password:</td>
            <td class="info-value" align="right" style="color:#C4A574;font-size:15px;">${temporaryPassword}</td>
          </tr>
        </table>
      </div>

      <div class="btn-container">
        <a class="btn" href="${loginUrl}">Log In to CA Hub</a>
      </div>

      <hr class="divider" />
      <p class="note">🔒 For your security, you will be prompted to choose a new password upon your first sign in.</p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Your CA Hub Office Admin Account Credentials',
      html,
    });
  },

  async sendEmployeeInviteEmail(user, temporaryPassword, designation) {
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
    const roleLabel = designation ? ` (${designation})` : '';
    const html = baseTemplate(
      'Your CA Hub Employee Account',
      `
      <h2>Employee Account Invitation</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your CA Office has created an employee workspace for you${roleLabel}.</p>
      <p>Use the credentials below to log in:</p>

      <div class="info-card">
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td class="info-label">Login ID (Email):</td>
            <td class="info-value" align="right">${user.email}</td>
          </tr>
          <tr>
            <td class="info-label">Temporary Password:</td>
            <td class="info-value" align="right" style="color:#C4A574;font-size:15px;">${temporaryPassword}</td>
          </tr>
        </table>
      </div>

      <div class="btn-container">
        <a class="btn" href="${loginUrl}">Sign In to Workspace</a>
      </div>

      <hr class="divider" />
      <p class="note">🔒 Please change this temporary password immediately after signing in.</p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Your CA Hub Employee Account Invitation',
      html,
    });
  },

  async sendPasswordChangedEmail(user) {
    const html = baseTemplate(
      'Security Alert: Password Changed',
      `
      <h2>Password Successfully Updated</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>The password for your <strong>CA Hub</strong> account was recently changed.</p>
      <p>If you performed this action, no further steps are required.</p>
      
      <hr class="divider" />
      <p class="note" style="color:#B45309 !important; font-weight:600;">⚠️ If you did NOT make this change, your account may be compromised. Please reset your password immediately or contact your office administrator.</p>

      <div class="btn-container">
        <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/forgot-password">Secure Account / Reset</a>
      </div>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Security Alert: CA Hub Password Changed',
      html,
    });
  },
};

export default emailService;