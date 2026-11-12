import { z } from 'zod';
import { DOCUMENT_TYPES } from '../utils/constants.js';

export const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().optional().default(true),
});

export const technicianProfileSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  hourlyRate: z.coerce.number().min(0).max(100000).nullable().optional(),
  isAvailable: z.boolean().optional(),
  skillCategoryIds: z.array(z.coerce.number().int().positive()).max(20).optional(),
  cities: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  availability: z.array(availabilitySchema).max(7).optional(),
});

export const directoryQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  city: z.string().trim().max(120).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  featured: z.enum(['true', 'false']).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(200).optional(),
  sort: z.enum(['rating', 'jobs', 'newest']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const verificationDecisionSchema = z.object({
  action: z.enum(['approve', 'reject', 'resubmit', 'suspend']),
  note: z.string().trim().max(1000).optional(),
});

export const documentUploadSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
});