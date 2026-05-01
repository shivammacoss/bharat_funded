const EmailTemplate = require('../models/EmailTemplate');

const DEFAULT_BRAND = 'BharatFundedTrade';

const DEFAULT_TEMPLATES = [
  {
    slug: 'signup_otp',
    name: 'Signup verification (OTP)',
    description: 'Sent when a user requests a verification code during registration.',
    subject: 'Your {{brandName}} verification code',
    variableKeys: ['code', 'otp', 'expiryMinutes', 'brandName'],
    order: 1,
    htmlBody: `<p>Your signup verification code is:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">{{code}}</p>
<p>This code expires in <strong>{{expiryMinutes}} minutes</strong>.</p>
<p>If you did not request this, you can ignore this email.</p>`,
    textBody:
      'Your signup verification code is: {{code}}\n\nIt expires in {{expiryMinutes}} minutes. If you did not request this, ignore this email.'
  },
  {
    slug: 'password_reset',
    name: 'Password reset (OTP)',
    description: 'Sent when a user requests a password reset code.',
    subject: 'Your {{brandName}} password reset code',
    variableKeys: ['code', 'otp', 'expiryMinutes', 'brandName'],
    order: 2,
    htmlBody: `<p>Your password reset code is:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:4px;">{{code}}</p>
<p>This code expires in <strong>{{expiryMinutes}} minutes</strong>.</p>
<p>If you did not request a reset, ignore this email.</p>`,
    textBody:
      'Your password reset code is: {{code}}\n\nIt expires in {{expiryMinutes}} minutes. If you did not request a reset, ignore this email.'
  },
  {
    slug: 'welcome',
    name: 'Welcome email',
    description: 'Sent right after successful signup. Hero banner + offers + full pricing table + rules + support links.',
    subject: 'Welcome to {{brandName}}, {{userName}} — your funded journey starts now',
    variableKeys: ['userName', 'userId', 'loginUrl', 'siteUrl', 'bannerUrl', 'brandName', 'year'],
    order: 3,
    htmlBody: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F2F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0D0F1A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0F2F8;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(13,15,26,0.08);">

<tr><td style="padding:0;background:linear-gradient(135deg,#0C0C1D 0%,#1E1E3F 50%,#2B4EFF 100%);position:relative;">
<a href="{{siteUrl}}" style="display:block;text-decoration:none;color:#fff;">
<!-- Self-contained HTML banner — no external image needed. Logo loads from
     /favicon.png on the public site; if that fails the gradient + text below
     still presents a complete hero so the email never looks broken. -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0C0C1D 0%,#1E1E3F 50%,#2B4EFF 100%);">
<tr><td style="padding:32px 28px 12px 28px;text-align:center;">
<img src="{{bannerUrl}}" alt="{{brandName}}" width="80" height="80" style="display:inline-block;width:80px;height:80px;border-radius:18px;background:rgba(255,255,255,0.08);padding:8px;border:0;outline:none;" />
</td></tr>
<tr><td style="padding:0 28px;text-align:center;">
<p style="margin:0;font-size:11px;font-weight:800;letter-spacing:3px;color:#FBBF24;text-transform:uppercase;">🇮🇳 India's Funded Trader Programme</p>
</td></tr>
<tr><td style="padding:8px 28px 6px 28px;text-align:center;">
<h1 style="margin:0;font-size:30px;font-weight:800;letter-spacing:-0.02em;color:#fff;line-height:1.15;">Welcome aboard,<br/>{{userName}}! 🎉</h1>
</td></tr>
<tr><td style="padding:14px 36px 32px 36px;text-align:center;">
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.92);">Your <strong style="color:#fff;">{{brandName}}</strong> account is live. Trade NIFTY, BANKNIFTY, SENSEX &amp; the rest of India's markets with our capital — and keep up to <strong style="color:#FBBF24;">80% of the profit</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
<td style="padding:6px 14px;background:rgba(16,185,129,0.18);border:1px solid rgba(16,185,129,0.45);border-radius:999px;font-size:11px;font-weight:700;color:#6EE7B7;letter-spacing:0.5px;">✓ Get Funded</td>
<td style="width:8px;"></td>
<td style="padding:6px 14px;background:rgba(43,78,255,0.25);border:1px solid rgba(96,165,250,0.45);border-radius:999px;font-size:11px;font-weight:700;color:#93C5FD;letter-spacing:0.5px;">📈 Trade Big</td>
<td style="width:8px;"></td>
<td style="padding:6px 14px;background:rgba(251,191,36,0.18);border:1px solid rgba(251,191,36,0.45);border-radius:999px;font-size:11px;font-weight:700;color:#FBBF24;letter-spacing:0.5px;">💰 Keep 80%</td>
</tr></table>
</td></tr>
</table>
</a></td></tr>

<tr><td style="padding:20px 28px 0 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFBFD;border:1px solid #E8EAF0;border-radius:10px;">
<tr><td style="padding:14px 18px;font-size:14px;color:#4B5165;">
<strong style="color:#0D0F1A;">Your User ID:</strong>
<span style="font-family:'Courier New',monospace;background:#fff;padding:3px 10px;border-radius:4px;border:1px solid #E8EAF0;color:#2B4EFF;font-weight:700;margin-left:8px;">{{userId}}</span>
</td></tr></table></td></tr>

<tr><td style="padding:24px 28px 0 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF7ED 0%,#FED7AA 100%);border:2px dashed #F59E0B;border-radius:12px;">
<tr><td style="padding:20px 22px;text-align:center;">
<p style="margin:0 0 6px 0;font-size:11px;font-weight:800;letter-spacing:2px;color:#B45309;text-transform:uppercase;">🎁 Limited-Time Offer</p>
<p style="margin:0 0 10px 0;font-size:22px;font-weight:800;color:#0D0F1A;">Get 10% OFF your first challenge</p>
<p style="margin:0 0 6px 0;font-size:13px;color:#78350F;">Use code <span style="background:#0D0F1A;color:#FBBF24;padding:5px 14px;border-radius:6px;font-family:'Courier New',monospace;font-weight:800;letter-spacing:1.5px;font-size:14px;">WELCOME10</span> at checkout</p>
<p style="margin:8px 0 0 0;font-size:11px;color:#92400E;">Coupons also work for influencer/referral tracking — share your code, earn payouts.</p>
</td></tr></table></td></tr>

<tr><td style="padding:32px 28px 0 28px;">
<h2 style="margin:0 0 4px 0;font-size:22px;font-weight:800;color:#0D0F1A;letter-spacing:-0.01em;">Pick your challenge</h2>
<p style="margin:0 0 18px 0;font-size:14px;color:#6B7080;">Three paths, one goal — get funded. Same instruments, transparent rules.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;background:#FAFBFD;border:1px solid #E8EAF0;border-radius:10px;border-left:4px solid #10B981;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 4px 0;font-size:11px;font-weight:800;color:#10B981;letter-spacing:1.5px;">🚀 INSTANT &middot; NO EVALUATION</p>
<p style="margin:0 0 10px 0;font-size:17px;font-weight:700;color:#0D0F1A;">Trade from day one</p>
<p style="margin:0 0 12px 0;font-size:13px;color:#4B5165;line-height:1.6;">Profit Target <strong>8%</strong> &middot; Daily DD <strong>3%</strong> &middot; Max DD <strong>6%</strong> &middot; Min <strong>5</strong> trading days &middot; Consistency <strong>30%</strong></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E8EAF0;border-radius:8px;font-size:13px;">
<tr style="background:#F0F2F8;"><td style="padding:8px 12px;font-weight:700;color:#0D0F1A;">Account Size</td><td style="padding:8px 12px;font-weight:700;color:#0D0F1A;text-align:right;">One-time Fee</td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹1,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹6,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹2,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹10,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹5,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹18,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹10,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹29,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹25,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹50,000</strong></td></tr>
</table></td></tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;background:#FAFBFD;border:1px solid #E8EAF0;border-radius:10px;border-left:4px solid #2B4EFF;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 4px 0;font-size:11px;font-weight:800;color:#2B4EFF;letter-spacing:1.5px;">⚡ 1-STEP &middot; MOST POPULAR</p>
<p style="margin:0 0 10px 0;font-size:17px;font-weight:700;color:#0D0F1A;">One phase, full freedom</p>
<p style="margin:0 0 12px 0;font-size:13px;color:#4B5165;line-height:1.6;">Profit Target <strong>10%</strong> &middot; Daily DD <strong>4%</strong> &middot; Max DD <strong>8%</strong> &middot; Min <strong>5</strong> trading days &middot; Max one-day profit <strong>40% of target</strong> &middot; News trading <strong>allowed</strong></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E8EAF0;border-radius:8px;font-size:13px;">
<tr style="background:#F0F2F8;"><td style="padding:8px 12px;font-weight:700;color:#0D0F1A;">Account Size</td><td style="padding:8px 12px;font-weight:700;color:#0D0F1A;text-align:right;">One-time Fee</td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹1,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹4,600</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹2,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹7,600</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹5,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹12,600</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹10,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹19,600</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹25,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹35,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹50,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹55,000</strong></td></tr>
</table></td></tr></table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFBFD;border:1px solid #E8EAF0;border-radius:10px;border-left:4px solid #8B5CF6;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 4px 0;font-size:11px;font-weight:800;color:#8B5CF6;letter-spacing:1.5px;">🎯 2-STEP &middot; LOWEST ENTRY</p>
<p style="margin:0 0 10px 0;font-size:17px;font-weight:700;color:#0D0F1A;">Two phases, easier targets</p>
<p style="margin:0 0 12px 0;font-size:13px;color:#4B5165;line-height:1.6;">Phase 1 target <strong>8%</strong> &middot; Phase 2 target <strong>5%</strong> &middot; Daily DD <strong>4%</strong> &middot; Max DD <strong>8%</strong> &middot; Min <strong>5</strong> days each phase &middot; Max one-day profit <strong>40% of target</strong></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E8EAF0;border-radius:8px;font-size:13px;">
<tr style="background:#F0F2F8;"><td style="padding:8px 12px;font-weight:700;color:#0D0F1A;">Account Size</td><td style="padding:8px 12px;font-weight:700;color:#0D0F1A;text-align:right;">One-time Fee</td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹1,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹3,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹2,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹5,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹5,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹8,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹10,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹13,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹25,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹22,000</strong></td></tr>
<tr><td style="padding:8px 12px;color:#4B5165;border-top:1px solid #F0F2F8;">₹50,00,000</td><td style="padding:8px 12px;color:#0D0F1A;text-align:right;border-top:1px solid #F0F2F8;"><strong>₹36,000</strong></td></tr>
</table></td></tr></table></td></tr>

<tr><td style="padding:32px 28px 0 28px;">
<h2 style="margin:0 0 14px 0;font-size:22px;font-weight:800;color:#0D0F1A;letter-spacing:-0.01em;">What you get</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:6px 0;font-size:14px;color:#4B5165;line-height:1.7;"><strong style="color:#10B981;">✓</strong>&nbsp;&nbsp;Up to <strong>80% profit split</strong> on funded accounts</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#4B5165;line-height:1.7;"><strong style="color:#10B981;">✓</strong>&nbsp;&nbsp;Bi-weekly payouts straight to your bank (after KYC)</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#4B5165;line-height:1.7;"><strong style="color:#10B981;">✓</strong>&nbsp;&nbsp;Trade <strong>NSE / NFO / BSE / BFO / MCX</strong> — NIFTY, BANKNIFTY, SENSEX, TCS &amp; more</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#4B5165;line-height:1.7;"><strong style="color:#10B981;">✓</strong>&nbsp;&nbsp;Real-time charts &amp; fast order execution via Zerodha</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#4B5165;line-height:1.7;"><strong style="color:#10B981;">✓</strong>&nbsp;&nbsp;Auto square-off at 15:15 IST — no overnight surprises</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#4B5165;line-height:1.7;"><strong style="color:#10B981;">✓</strong>&nbsp;&nbsp;Coupons + referral payouts for influencers</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#4B5165;line-height:1.7;"><strong style="color:#10B981;">✓</strong>&nbsp;&nbsp;WhatsApp support that actually replies</td></tr>
</table></td></tr>

<tr><td style="padding:32px 28px;text-align:center;">
<a href="{{loginUrl}}" style="display:inline-block;background:linear-gradient(135deg,#2B4EFF 0%,#4B6AFF 100%);color:#fff;text-decoration:none;padding:16px 42px;border-radius:999px;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(43,78,255,0.35);">Login &amp; Start Trading →</a>
<p style="margin:14px 0 0 0;font-size:12px;color:#9AA0B4;">Use code <strong style="color:#F59E0B;">WELCOME10</strong> at checkout for 10% off your first challenge</p>
</td></tr>

<tr><td style="padding:0 28px 28px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0C0C1D;border-radius:12px;">
<tr><td style="padding:22px 24px;">
<p style="margin:0 0 12px 0;font-size:13px;font-weight:800;color:#fff;letter-spacing:1px;text-transform:uppercase;">Need help? We're here.</p>
<p style="margin:0 0 6px 0;font-size:13px;color:#9AA0B4;line-height:1.7;">📧&nbsp; <a href="mailto:bharathfundedtradersupport@gmail.com" style="color:#60A5FA;text-decoration:none;">bharathfundedtradersupport@gmail.com</a></p>
<p style="margin:0 0 6px 0;font-size:13px;color:#9AA0B4;line-height:1.7;">📞&nbsp; <a href="tel:+918367045119" style="color:#60A5FA;text-decoration:none;">+91 8367045119</a> &nbsp;·&nbsp; Mon–Sat 10 AM – 6 PM IST</p>
<p style="margin:0 0 6px 0;font-size:13px;color:#9AA0B4;line-height:1.7;">💬&nbsp; <a href="https://wa.me/918367045119" style="color:#60A5FA;text-decoration:none;">WhatsApp +91 8367045119</a></p>
<p style="margin:0;font-size:13px;color:#9AA0B4;line-height:1.7;">📱&nbsp; <a href="https://t.me/bharathfundedtraderr" style="color:#60A5FA;text-decoration:none;">Telegram @bharathfundedtraderr</a></p>
</td></tr></table></td></tr>

</table>
<p style="margin:18px 0 0 0;text-align:center;font-size:11px;color:#9AA0B4;">© {{year}} {{brandName}}. All rights reserved.<br>You're receiving this because you registered an account at <a href="{{siteUrl}}" style="color:#9AA0B4;">{{siteUrl}}</a>.</p>
</td></tr></table></body></html>`,
    textBody: `Hi {{userName}},

Welcome aboard! Your {{brandName}} account is live and ready.
Trade NIFTY, BANKNIFTY, SENSEX & more with our capital — keep up to 80% of the profit.

Your User ID: {{userId}}

═══ LIMITED-TIME OFFER ═══
Use code WELCOME10 at checkout for 10% OFF on your first challenge.
(Coupons also track influencer / referral payouts.)

═══ PICK YOUR CHALLENGE ═══

🚀 INSTANT — No evaluation, trade from day one
   Rules: 8% target | Daily DD 3% | Max DD 6% | Min 5 trading days | Consistency 30%
   ₹1L → ₹6,000   |   ₹2L → ₹10,000   |   ₹5L → ₹18,000
   ₹10L → ₹29,000   |   ₹25L → ₹50,000

⚡ 1-STEP — Single phase, most popular
   Rules: 10% target | Daily DD 4% | Max DD 8% | Min 5 trading days
          Max one-day profit 40% of target | News trading allowed
   ₹1L → ₹4,600   |   ₹2L → ₹7,600   |   ₹5L → ₹12,600
   ₹10L → ₹19,600   |   ₹25L → ₹35,000   |   ₹50L → ₹55,000

🎯 2-STEP — Two phases, lowest entry
   Phase 1: 8% target  |  Phase 2: 5% target
   Daily DD 4% | Max DD 8% | Min 5 days each phase | Max one-day profit 40% of target
   ₹1L → ₹3,000   |   ₹2L → ₹5,000   |   ₹5L → ₹8,000
   ₹10L → ₹13,000   |   ₹25L → ₹22,000   |   ₹50L → ₹36,000

═══ WHAT YOU GET ═══
  • Up to 80% profit split on funded accounts
  • Bi-weekly payouts straight to your bank (after KYC)
  • Trade NSE / NFO / BSE / BFO / MCX
  • Real-time charts via Zerodha integration
  • Auto square-off at 15:15 IST — no overnight surprises
  • Coupon + referral payout system for influencers
  • WhatsApp support that actually replies

═══ NEXT STEP ═══
1. Login → {{loginUrl}}
2. Pick a challenge & apply WELCOME10
3. Fund your wallet, hit the target, get paid

─── Need help? ───
Email:    bharathfundedtradersupport@gmail.com
Phone:    +91 8367045119  (Mon–Sat 10 AM – 6 PM IST)
WhatsApp: +91 8367045119
Telegram: @bharathfundedtraderr

Trade safe — see you on the charts!
— The {{brandName}} team

© {{year}} {{brandName}}. All rights reserved.`
  },
  {
    slug: 'account_banned',
    name: 'Account banned',
    description: 'Notify user that their account has been restricted.',
    subject: 'Your {{brandName}} account has been suspended',
    variableKeys: ['userName', 'reason', 'brandName', 'supportEmail'],
    order: 4,
    htmlBody:
      '<p>Hi {{userName}},</p><p>Your account has been suspended.</p><p><strong>Reason:</strong> {{reason}}</p><p>Contact: {{supportEmail}}</p>',
    textBody: 'Hi {{userName}},\n\nYour account has been suspended.\nReason: {{reason}}\nSupport: {{supportEmail}}'
  },
  {
    slug: 'account_unbanned',
    name: 'Account restored',
    description: 'Notify user that their account is active again.',
    subject: 'Your {{brandName}} account is active again',
    variableKeys: ['userName', 'brandName', 'loginUrl'],
    order: 5,
    htmlBody: '<p>Hi {{userName}},</p><p>Your account has been restored. You can log in at <a href="{{loginUrl}}">{{loginUrl}}</a>.</p>',
    textBody: 'Hi {{userName}},\n\nYour account has been restored.\nLogin: {{loginUrl}}'
  },
  {
    slug: 'deposit_approved',
    name: 'Deposit approved',
    description: 'Sent when a deposit request is approved.',
    subject: 'Deposit confirmed — {{brandName}}',
    variableKeys: ['userName', 'amount', 'currency', 'brandName'],
    order: 6,
    htmlBody:
      '<p>Hi {{userName}},</p><p>Your deposit of <strong>{{amount}} {{currency}}</strong> has been credited.</p>',
    textBody: 'Hi {{userName}},\n\nYour deposit of {{amount}} {{currency}} has been credited.'
  },
  {
    slug: 'withdrawal_approved',
    name: 'Withdrawal approved',
    description: 'Sent when a withdrawal is processed.',
    subject: 'Withdrawal processed — {{brandName}}',
    variableKeys: ['userName', 'amount', 'currency', 'brandName'],
    order: 7,
    htmlBody:
      '<p>Hi {{userName}},</p><p>Your withdrawal of <strong>{{amount}} {{currency}}</strong> has been processed.</p>',
    textBody: 'Hi {{userName}},\n\nYour withdrawal of {{amount}} {{currency}} has been processed.'
  }
];

function interpolate(str, vars) {
  if (!str) return '';
  const merged = { brandName: DEFAULT_BRAND, ...vars };
  return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = merged[key];
    return v !== undefined && v !== null ? String(v) : '';
  });
}

async function seedMissingTemplates() {
  let created = 0;
  for (const t of DEFAULT_TEMPLATES) {
    const exists = await EmailTemplate.findOne({ slug: t.slug });
    if (!exists) {
      await EmailTemplate.create({ ...t, enabled: true });
      created += 1;
    }
  }
  return created;
}

async function resetAndSeed() {
  await EmailTemplate.deleteMany({});
  await EmailTemplate.insertMany(DEFAULT_TEMPLATES.map((t) => ({ ...t, enabled: true })));
  return DEFAULT_TEMPLATES.length;
}

function renderTemplateDoc(doc, vars) {
  if (!doc) return null;
  return {
    subject: interpolate(doc.subject, vars),
    text: interpolate(doc.textBody || '', vars),
    html: interpolate(doc.htmlBody || '', vars)
  };
}

/**
 * @returns {{ subject: string, text: string, html: string } | null}
 */
async function getRenderedForSend(slug, vars) {
  const doc = await EmailTemplate.findOne({ slug: String(slug).toLowerCase().trim() });
  if (!doc || !doc.enabled) return null;
  return renderTemplateDoc(doc, vars);
}

function sampleVariablesForSlug(slug) {
  const base = {
    code: '123456',
    otp: '123456',
    expiryMinutes: '10',
    brandName: DEFAULT_BRAND,
    supportEmail: 'support@example.com',
    userName: 'Demo User',
    loginUrl: 'https://example.com/login',
    reason: 'Policy review',
    amount: '1,000.00',
    currency: 'INR'
  };
  const s = String(slug).toLowerCase();
  if (s === 'password_reset') return { ...base, expiryMinutes: '15' };
  return base;
}

module.exports = {
  DEFAULT_TEMPLATES,
  interpolate,
  seedMissingTemplates,
  resetAndSeed,
  getRenderedForSend,
  renderTemplateDoc,
  sampleVariablesForSlug
};
