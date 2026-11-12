import { parseJsonValue } from '../models/helpers.js';

export function userJSON(user) {
  if (!user) return null;
  const raw = user.toJSON ? user.toJSON() : { ...user };
  delete raw.passwordHash;
  return raw;
}

export function publicUserJSON(user) {
  if (!user) return null;
  const raw = userJSON(user);
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    avatarUrl: raw.avatarUrl,
    lastActiveAt: raw.lastActiveAt,
  };
}

export function stripSecretFields(value) {
  if (!value) return value;
  const clone = JSON.parse(JSON.stringify(value));
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.tokenHash;
  return clone;
}

export function asJson(value, fallback = null) {
  return parseJsonValue(value, fallback);
}