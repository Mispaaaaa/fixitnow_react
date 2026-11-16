import { env } from '../src/config/env.js';
import {
  hasGoogleOAuthCredentials,
  sendMail,
  verifyEmailTransport,
} from '../src/services/email.service.js';

const to = process.argv[2];

if (!to) {
  console.error('Usage: npm run email:test -- recipient@example.com');
  process.exit(1);
}

try {
  await verifyEmailTransport();
  console.log(
    `SMTP connection OK (${hasGoogleOAuthCredentials() ? 'Google OAuth2 refresh token' : 'Gmail App Password'})`
  );
  const info = await sendMail({
    to,
    subject: 'FixitNow email test',
    text: [
      'This is a delivery test from FixitNow.',
      `From: ${env.smtp.from}`,
      'If you received this, password recovery emails will be delivered.',
    ].join('\n'),
  });
  console.log('Email accepted for delivery:', info.accepted);
} catch (error) {
  console.error('Email test failed:', error.message);
  process.exitCode = 1;
}
