import bcrypt from 'bcrypt';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { publicFileUrl } from '../middleware/upload.js';
import { userJSON } from '../utils/serialize.js';
import { refreshCookieOptions } from '../utils/jwt.js';
import {
  findFullUser,
  loginUser,
  refreshSession,
  registerUser,
  revokeAllSessions,
  revokeSession,
} from '../services/auth.service.js';

const cookieClearOptions = { ...refreshCookieOptions(), maxAge: undefined };

export const register = asyncHandler(async (req, res) => {
  const { accessToken, user } = await registerUser(req.body, req, res);
  res.status(201).json({
    success: true,
    message: 'Account created. Welcome to FixitNow!',
    data: { accessToken, user: userJSON(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, user } = await loginUser(req.body, req, res);
  res.json({
    success: true,
    message: 'Logged in',
    data: { accessToken, user: userJSON(user) },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const { accessToken, user } = await refreshSession(req.cookies.refreshToken, req, res);
    res.json({
      success: true,
      message: 'Session refreshed',
      data: { accessToken, user: userJSON(user) },
    });
  } catch (error) {
    res.clearCookie('refreshToken', cookieClearOptions);
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await revokeSession(req.cookies.refreshToken);
  res.clearCookie('refreshToken', cookieClearOptions);
  res.json({ success: true, message: 'Logged out', data: null });
});

export const me = asyncHandler(async (req, res) => {
  const user = await findFullUser(req.user.id);
  res.json({ success: true, message: 'OK', data: { user: userJSON(user) } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.phone !== undefined) updates.phone = req.body.phone || null;
  await req.user.update(updates);
  const user = await findFullUser(req.user.id);
  res.json({ success: true, message: 'Profile updated', data: { user: userJSON(user) } });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose an image to upload');
  const url = publicFileUrl(`avatars/${req.file.filename}`);
  await req.user.update({ avatarUrl: url });
  res.json({ success: true, message: 'Avatar updated', data: { avatarUrl: url } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await req.user.reload({ include: [{ association: 'technicianProfile' }] });
  const matches = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!matches) throw ApiError.badRequest('Current password is incorrect');
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  await revokeAllSessions(user.id);
  res.clearCookie('refreshToken', cookieClearOptions);
  res.json({
    success: true,
    message: 'Password changed. Please log in again.',
    data: null,
  });
});