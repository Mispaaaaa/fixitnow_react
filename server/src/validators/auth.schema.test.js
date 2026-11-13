import { forgotPasswordSchema, resetPasswordSchema } from './auth.schema.js';

describe('password recovery schemas', () => {
  it('normalizes valid recovery emails', () => {
    expect(forgotPasswordSchema.parse({ email: '  USER@example.com ' })).toEqual({
      email: 'user@example.com',
    });
  });

  it('requires a valid reset token and a strong-enough password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'a'.repeat(64), newPassword: 'newPass123' }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: 'short', newPassword: 'short' }).success).toBe(false);
  });
});
