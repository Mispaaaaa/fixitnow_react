import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export async function sendPasswordResetEmail({ to, name, token }) {
  if (!env.smtp.user || !env.smtp.appPassword || !env.smtp.from) {
    throw new ApiError(503, 'Password recovery email is not configured. Set Gmail SMTP credentials in server/.env.');
  }

  const resetUrl = new URL('/reset-password', env.clientUrl);
  resetUrl.searchParams.set('token', token);

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.appPassword },
  });

  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: 'Reset your FixitNow password',
      text: [
        `Hello${name ? ` ${name}` : ''},`,
        '',
        'We received a request to reset your FixitNow password.',
        `Use this link within 30 minutes: ${resetUrl.toString()}`,
        '',
        'If you did not request a reset, you can ignore this email.',
      ].join('\n'),
    });
  } catch {
    console.error('Gmail SMTP could not deliver a password recovery email.');
    throw new ApiError(503, 'Password recovery email could not be delivered. Check the Gmail SMTP settings.');
  }
}
