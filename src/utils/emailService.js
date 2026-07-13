import nodemailer from 'nodemailer';
import logger from './logger.js';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: rgba(255,255,255,0.75); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 36px 40px; }
    .body p { color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 16px; }
    .btn { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 8px 0 20px; }
    .btn:hover { background: #1d4ed8; }
    .token-box { background: #f0f9ff; border: 1px dashed #93c5fd; border-radius: 10px; padding: 14px 20px; text-align: center; font-size: 28px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; margin: 20px 0; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .note { color: #9ca3af !important; font-size: 12px !important; }
    .footer { background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>CA Management</h1>
      <p>Office Management System</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CA Management System. All rights reserved.</p>
      <p style="margin-top:4px;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

const emailService = {
  async sendEmail({ to, subject, html }) {
    const isConfigured =
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_USER !== 'your@email.com';

    if (!isConfigured) {
      logger.warn(`[Email] SMTP not configured — skipped email to ${to}: "${subject}"`);
      return { skipped: true };
    }

    try {
      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'CA Management'}" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      });
      logger.info(`[Email] Sent to ${to}: ${subject} (messageId: ${info.messageId})`);
      return info;
    } catch (error) {
      logger.error(`[Email] Failed to send to ${to}:`, error.message);
      throw error;
    }
  },

  async sendWelcomeEmail(user) {
    const html = baseTemplate(
      'Welcome to CA Management',
      `
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Welcome to <strong>CA Management System</strong>! Your account has been created successfully.</p>
      <p>You can now log in and start managing your CA office workflows efficiently.</p>
      <p style="text-align:center;">
        <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login">Sign In to Your Account</a>
      </p>
      <hr class="divider" />
      <p><strong>Your account details:</strong></p>
      <p>Email: <strong>${user.email}</strong><br/>Role: <strong>${user.role}</strong></p>
      <p class="note">If you did not create this account, please contact your administrator immediately.</p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to CA Management System',
      html,
    });
  },

  async sendPasswordResetEmail(user, resetToken, resetUrl) {
    const html = baseTemplate(
      'Password Reset Request',
      `
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <p style="text-align:center;">
        <a class="btn" href="${resetUrl}">Reset My Password</a>
      </p>
      <p class="note" style="text-align:center;">Or copy and paste this link in your browser:<br/>
        <span style="color:#2563eb;font-size:11px;word-break:break-all;">${resetUrl}</span>
      </p>
      <hr class="divider" />
      <p class="note">⏱ This link expires in <strong>10 minutes</strong>.</p>
      <p class="note">🔒 If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset — CA Management',
      html,
    });
  },

  async sendPasswordResetOTPEmail(user, otp) {
    const html = baseTemplate(
      'Password Reset OTP',
      `
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Use the OTP below to reset your CA Management password:</p>
      <div class="token-box">${otp}</div>
      <p class="note" style="text-align:center;">⏱ This OTP expires in <strong>10 minutes</strong>.</p>
      <hr class="divider" />
      <p class="note">🔒 If you did not request this, please ignore this email. Your account is still secure.</p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset OTP — CA Management',
      html,
    });
  },

  async sendPasswordChangedEmail(user) {
    const html = baseTemplate(
      'Password Changed',
      `
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Your CA Management password was successfully changed.</p>
      <p>If you made this change, no further action is needed.</p>
      <p class="note">🔒 If you did NOT make this change, please contact your administrator immediately or reset your password.</p>
      <p style="text-align:center;">
        <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/forgot-password">Reset Password</a>
      </p>
      `
    );
    return this.sendEmail({
      to: user.email,
      subject: 'Password Changed — CA Management',
      html,
    });
  },
};

export default emailService;
