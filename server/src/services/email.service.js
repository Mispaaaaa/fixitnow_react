import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export function hasGoogleOAuthCredentials() {
  return Boolean(env.google.clientId && env.google.clientSecret && env.google.refreshToken);
}

export function isEmailConfigured() {
  return Boolean(
    env.smtp.user &&
      env.smtp.from &&
      (hasGoogleOAuthCredentials() || env.smtp.appPassword)
  );
}

function createTransporter() {
  const options = {
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  };

  if (hasGoogleOAuthCredentials()) {
    return nodemailer.createTransport({
      ...options,
      auth: {
        type: 'OAuth2',
        user: env.smtp.user,
        clientId: env.google.clientId,
        clientSecret: env.google.clientSecret,
        refreshToken: env.google.refreshToken,
      },
    });
  }

  return nodemailer.createTransport({
    ...options,
    auth: { user: env.smtp.user, pass: env.smtp.appPassword },
  });
}

export async function sendMail(message) {
  if (!isEmailConfigured()) {
    throw new ApiError(
      503,
      'Email is not configured. Set Gmail OAuth2 or App Password credentials in server/.env.'
    );
  }
  const transporter = createTransporter();
  return transporter.sendMail({ from: env.smtp.from, ...message });
}

export async function verifyEmailTransport() {
  if (!isEmailConfigured()) {
    throw new ApiError(
      503,
      'Email is not configured. Set Gmail OAuth2 or App Password credentials in server/.env.'
    );
  }
  await createTransporter().verify();
}

export async function sendPasswordResetEmail({ to, name, token }) {
  if (!isEmailConfigured()) {
    throw new ApiError(
      503,
      'Password recovery email is not configured. Set Gmail OAuth2 or App Password credentials in server/.env.'
    );
  }

  const resetUrl = new URL('/reset-password', env.clientUrl);
  resetUrl.searchParams.set('token', token);

  try {
    await sendMail({
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
  } catch (error) {
    console.error('Gmail could not deliver a password recovery email.', {
      transport: hasGoogleOAuthCredentials() ? 'oauth2' : 'app-password',
      code: error.code || 'UNKNOWN',
      responseCode: error.responseCode,
      command: error.command,
      message: error.message,
    });
    throw new ApiError(
      503,
      'Password recovery email could not be delivered. Check the Gmail OAuth2/SMTP settings.'
    );
  }
}
