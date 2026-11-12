import { Op } from 'sequelize';
import {
  Announcement,
  SavedAddress,
  ServiceRequest,
  SiteContent,
  TechnicianProfile,
} from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { defaultContentFor } from '../utils/defaultContent.js';

export async function activeAnnouncementsFor(role) {
  const now = new Date();
  return Announcement.findAll({
    where: {
      role: { [Op.in]: [role, 'all'] },
      isActive: true,
      [Op.and]: [
        { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
        { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gte]: now } }] },
      ],
    },
    order: [['createdAt', 'DESC']],
    limit: 5,
  });
}

export const customerDashboard = asyncHandler(async (req, res) => {
  const [requests, contentRow, announcements, addresses] = await Promise.all([
    ServiceRequest.findAll({
      where: { customerId: req.user.id },
      include: [
        { association: 'category', attributes: ['id', 'name', 'icon'] },
        { association: 'technician', attributes: ['id', 'name', 'avatarUrl'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    }),
    SiteContent.findOne({ where: { key: 'dashboard_customer' } }),
    activeAnnouncementsFor('customer'),
    SavedAddress.count({ where: { userId: req.user.id } }),
  ]);

  res.json({
    success: true,
    message: 'OK',
    data: {
      content: contentRow?.blocks || defaultContentFor('dashboard_customer'),
      announcements,
      requests,
      addressCount: addresses,
    },
  });
});

export const technicianDashboard = asyncHandler(async (req, res) => {
  const [profile, contentRow, announcements] = await Promise.all([
    TechnicianProfile.findOne({ where: { userId: req.user.id } }),
    SiteContent.findOne({ where: { key: 'dashboard_technician' } }),
    activeAnnouncementsFor('technician'),
  ]);
  res.json({
    success: true,
    message: 'OK',
    data: {
      content: contentRow?.blocks || defaultContentFor('dashboard_technician'),
      announcements,
      profile,
    },
  });
});