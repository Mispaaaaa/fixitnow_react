import { z } from 'zod';
import { ANNOUNCEMENT_STYLES } from '../utils/constants.js';

export const adminListSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().trim().max(40).optional(),
  q: z.string().trim().max(120).optional(),
  type: z.string().trim().max(40).optional(),
});

export const requestAssignmentSchema = z.object({
  technicianId: z.coerce.number().int().positive().nullable(),
});

export const userStatusSchema = z.object({
  isActive: z.boolean(),
});

export const verificationDecisionSchema = z.object({
  action: z.enum(['approve', 'reject', 'resubmit', 'suspend']),
  note: z.string().trim().max(1000).nullable().optional(),
});

export const reviewVisibilitySchema = z.object({
  isHidden: z.boolean(),
  hiddenNote: z.string().trim().max(500).nullable().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(60).nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const categoryUpdateSchema = categorySchema.partial();

export const contentSchema = z.object({
  blocks: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]),
});

export const announcementSchema = z.object({
  role: z.enum(['customer', 'technician', 'all']).default('all'),
  title: z.string().trim().min(2).max(180),
  text: z.string().trim().min(2),
  style: z.enum(ANNOUNCEMENT_STYLES).default('info'),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});
