import nodemailer from 'nodemailer';

const parseBoolean = (value) => String(value || '').toLowerCase() === 'true';

const createTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: parseBoolean(process.env.SMTP_SECURE),
    auth: {
      user,
      pass,
    },
  });
};

export const sendPasswordResetEmail = async ({ to, resetUrl, name }) => {
  const transporter = createTransport();

  if (!transporter) {
    return {
      delivered: false,
      reason: 'SMTP_NOT_CONFIGURED',
    };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || 'Choose Not To Stop';
  const safeName = name || 'there';

  const text = [
    `Hi ${safeName},`,
    '',
    'We received a request to reset your password.',
    'Use the link below to set a new password (valid for 10 minutes):',
    resetUrl,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    `- ${appName}`,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your password.</p>
      <p>
        Use the link below to set a new password (valid for 10 minutes):
      </p>
      <p>
        <a href="${resetUrl}" style="background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block;">
          Reset Password
        </a>
      </p>
      <p>If the button does not work, copy and paste this URL into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>- ${appName}</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `${appName} Password Reset`,
    text,
    html,
  });

  return {
    delivered: true,
  };
};

export const sendVerificationEmail = async ({ to, verificationUrl, name }) => {
  const transporter = createTransport();

  if (!transporter) {
    return {
      delivered: false,
      reason: 'SMTP_NOT_CONFIGURED',
    };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || 'Choose Not To Stop';
  const safeName = name || 'there';

  const text = [
    `Hi ${safeName},`,
    '',
    'Welcome to Choose Not To Stop.',
    'Please verify your email address using the link below:',
    verificationUrl,
    '',
    'If you did not create this account, you can ignore this message.',
    '',
    `- ${appName}`,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p>Hi ${safeName},</p>
      <p>Welcome to ${appName}.</p>
      <p>Please verify your email address to activate your account.</p>
      <p>
        <a href="${verificationUrl}" style="background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block;">
          Verify Email
        </a>
      </p>
      <p>If the button does not work, copy and paste this URL into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not create this account, you can ignore this message.</p>
      <p>- ${appName}</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `${appName} Verify Your Email`,
    text,
    html,
  });

  return {
    delivered: true,
  };
};
