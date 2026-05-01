const nodemailer = require('nodemailer');
const emailTemplateService = require('./emailTemplate.service');

function trimEnv(v) {
  if (v == null || v === undefined) return '';
  let s = String(v).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/** Parsed SMTP settings (trimmed). Use for health checks without exposing secrets. */
function getSmtpConfig() {
  const host = trimEnv(process.env.SMTP_HOST);
  const user = trimEnv(process.env.SMTP_USER);
  const pass = trimEnv(process.env.SMTP_PASS);
  const rawPort = trimEnv(process.env.SMTP_PORT);
  const portNum = Number(rawPort || 465);
  const port = Number.isFinite(portNum) && portNum > 0 ? portNum : 465;

  const sec = trimEnv(process.env.SMTP_SECURE).toLowerCase();
  let secure;
  if (sec === 'true') secure = true;
  else if (sec === 'false') secure = false;
  else secure = port === 465;

  return { host, user, pass, port, secure };
}

function isSmtpConfigured() {
  const { host, user, pass } = getSmtpConfig();
  return !!(host && user && pass);
}

function formatSmtpError(err) {
  const bits = [];
  if (err?.message) bits.push(err.message);
  if (err?.response) bits.push(String(err.response).trim());
  if (err?.responseCode != null) bits.push(`SMTP ${err.responseCode}`);
  if (err?.command) bits.push(`(${err.command})`);
  return bits.filter(Boolean).join(' — ') || 'SMTP error';
}

function createTransport() {
  const { host, user, pass, port, secure } = getSmtpConfig();
  if (!host || !user || !pass) return null;

  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';

  const options = {
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 25_000,
    greetingTimeout: 25_000,
    socketTimeout: 45_000,
    tls: {
      rejectUnauthorized,
      minVersion: 'TLSv1.2',
      servername: host
    }
  };

  // Port 587 (and similar submission ports): STARTTLS — must not use implicit TLS (secure: false).
  if (!secure && (port === 587 || port === 2587)) {
    options.requireTLS = true;
  }

  if (process.env.SMTP_DEBUG === 'true') {
    options.debug = true;
    options.logger = true;
  }

  return nodemailer.createTransport(options);
}

function fromAddress() {
  const name = trimEnv(process.env.SMTP_FROM_NAME) || 'BharatFundedTrade';
  const addr = trimEnv(process.env.SMTP_FROM) || trimEnv(process.env.SMTP_USER);
  return `"${name}" <${addr}>`;
}

async function sendMail({ to, subject, text, html }) {
  const transporter = createTransport();
  if (!transporter) {
    throw new Error('SMTP is not configured');
  }
  try {
    await transporter.sendMail({
      from: fromAddress(),
      to,
      subject,
      text: text || undefined,
      html: html || text || undefined
    });
  } catch (err) {
    throw new Error(formatSmtpError(err));
  }
}

async function verifySmtpConnection() {
  const transporter = createTransport();
  if (!transporter) {
    throw new Error('SMTP is not configured');
  }
  try {
    await transporter.verify();
  } catch (err) {
    const cfg = getSmtpConfig();
    let hint = '';
    if (cfg.port === 587 && cfg.secure) {
      hint = ' For port 587 use STARTTLS: set SMTP_SECURE=false in .env.';
    } else if (cfg.port === 465 && !cfg.secure) {
      hint = ' For port 465 use implicit SSL: set SMTP_SECURE=true in .env.';
    }
    throw new Error(formatSmtpError(err) + hint);
  }
}

function getSmtpStatusForAdmin() {
  const { host, user, port, secure } = getSmtpConfig();
  const mask =
    user && user.includes('@')
      ? `${user.slice(0, 2)}***@${user.split('@')[1]}`
      : user
        ? '***'
        : '';
  return {
    host: host || null,
    port,
    secure,
    userHint: mask,
    configured: isSmtpConfigured()
  };
}

async function sendSignupOtpEmail(to, code) {
  const vars = { code, otp: code, expiryMinutes: '10' };
  const rendered = await emailTemplateService.getRenderedForSend('signup_otp', vars);
  if (rendered) {
    await sendMail({
      to,
      subject: rendered.subject,
      text: rendered.text || `Your signup verification code is: ${code}`,
      html: rendered.html || rendered.text
    });
    return;
  }
  const subject = 'Your BharatFundedTrade verification code';
  const text = `Your signup verification code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`;
  const html = `
    <p>Your signup verification code is:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
    <p>This code expires in <strong>10 minutes</strong>.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;
  await sendMail({ to, subject, text, html });
}

async function sendPasswordResetOtpEmail(to, code) {
  const vars = { code, otp: code, expiryMinutes: '15' };
  const rendered = await emailTemplateService.getRenderedForSend('password_reset', vars);
  if (rendered) {
    await sendMail({
      to,
      subject: rendered.subject,
      text: rendered.text || `Your password reset code is: ${code}`,
      html: rendered.html || rendered.text
    });
    return;
  }
  const subject = 'Your BharatFundedTrade password reset code';
  const text = `Your password reset code is: ${code}\n\nIt expires in 15 minutes. If you did not request this, ignore this email.`;
  const html = `
    <p>Your password reset code is:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>
    <p>This code expires in <strong>15 minutes</strong>.</p>
    <p>If you did not request a reset, ignore this email.</p>
  `;
  await sendMail({ to, subject, text, html });
}

async function sendWelcomeEmail(to, { name, userId } = {}) {
  // Try the admin-managed template first so marketing can edit copy from the
  // panel; fall back to a hard-coded design if the template isn't seeded yet.
  const safeName = String(name || '').trim() || 'Trader';
  const safeUserId = String(userId || '').trim();
  const vars = { name: safeName, userId: safeUserId, year: String(new Date().getFullYear()) };

  try {
    const rendered = await emailTemplateService.getRenderedForSend('welcome', vars);
    if (rendered) {
      await sendMail({ to, subject: rendered.subject, text: rendered.text, html: rendered.html || rendered.text });
      return;
    }
  } catch (_) {
    /* fall through to hard-coded copy */
  }

  const subject = `Welcome to Bharat Funded Trader, ${safeName}!`;
  const text = [
    `Hi ${safeName},`,
    '',
    'Welcome aboard — your Bharat Funded Trader account is live.',
    safeUserId ? `Your User ID: ${safeUserId}` : null,
    '',
    'What you can do next:',
    '  • Pick a challenge (1-Step / 2-Step / Instant)',
    '  • Fund your wallet and start your evaluation',
    '  • Reach us anytime at support@bharathfundedtrader.com or WhatsApp +91 8367045119',
    '',
    'Trade safe — see you on the charts!',
    '— The Bharat Funded Trader team'
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0D0F1A;">
      <div style="background: linear-gradient(135deg, #2B4EFF 0%, #4B6AFF 100%); padding: 28px 24px; border-radius: 12px 12px 0 0; color: #fff;">
        <h1 style="margin: 0; font-size: 22px; letter-spacing: -0.02em;">Welcome to Bharat Funded Trader</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Your trader account is live, ${safeName}.</p>
      </div>
      <div style="background: #FAFBFD; padding: 24px; border: 1px solid #E8EAF0; border-top: none; border-radius: 0 0 12px 12px;">
        ${safeUserId ? `<p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Your User ID:</strong> <span style="font-family: monospace; background: #fff; padding: 2px 8px; border-radius: 4px; border: 1px solid #E8EAF0;">${safeUserId}</span></p>` : ''}
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6;">Here's what you can do next:</p>
        <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; line-height: 1.7; color: #4B5165;">
          <li>Pick a challenge — <strong>1-Step</strong>, <strong>2-Step</strong>, or <strong>Instant</strong></li>
          <li>Fund your wallet and start your evaluation</li>
          <li>Track your performance from the dashboard</li>
        </ul>
        <p style="margin: 16px 0 0 0; font-size: 13px; color: #6B7080;">Need help? Reply to this email or reach us on WhatsApp <a href="https://wa.me/918367045119" style="color: #2B4EFF; text-decoration: none;">+91 8367045119</a> or Telegram <a href="https://t.me/bharathfundedtraderr" style="color: #2B4EFF; text-decoration: none;">@bharathfundedtraderr</a>.</p>
      </div>
      <p style="margin: 16px 0 0 0; text-align: center; font-size: 11px; color: #9AA0B4;">© ${vars.year} Bharat Funded Trader. All rights reserved.</p>
    </div>
  `;

  await sendMail({ to, subject, text, html });
}

module.exports = {
  isSmtpConfigured,
  createTransport,
  verifySmtpConnection,
  sendMail,
  sendSignupOtpEmail,
  sendPasswordResetOtpEmail,
  sendWelcomeEmail,
  getSmtpConfig,
  getSmtpStatusForAdmin
};
