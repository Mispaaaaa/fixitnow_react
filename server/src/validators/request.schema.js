import { z } from 'zod';
import { REQUEST_STATUSES, TIME_SLOTS, URGENCIES } from '../utils/constants.js';
import { isServiceArea } from '../utils/serviceArea.js';

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const preferredDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date')
  .refine((value) => value >= todayLocal(), 'Choose today or a future date');

const coordinates = {
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
};

const addressFields = {
  savedAddressId: z.coerce.number().int().positive().optional(),
  address: z.string().trim().min(5).max(500).optional(),
  city: z.string().trim().min(1).max(120).refine(isServiceArea, 'Choose a municipality in Oriental Mindoro').optional(),
  ...coordinates,
};

export const createRequestSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  applianceBrand: z.string().trim().max(120).optional(),
  applianceModel: z.string().trim().max(120).optional(),
  issueDescription: z.string().trim().min(10).max(4000),
  urgency: z.enum(URGENCIES).default('normal'),
  preferredDate,
  timeSlot: z.enum(TIME_SLOTS),
  preferredTechnicianId: z.coerce.number().int().positive().optional(),
  ...addressFields,
});

export const updateRequestSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  applianceBrand: z.string().trim().max(120).nullable().optional(),
  applianceModel: z.string().trim().max(120).nullable().optional(),
  issueDescription: z.string().trim().min(10).max(4000).optional(),
  urgency: z.enum(URGENCIES).optional(),
  preferredDate: preferredDate.optional(),
  timeSlot: z.enum(TIME_SLOTS).optional(),
  ...addressFields,
});

export const requestQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(REQUEST_STATUSES).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  city: z.string().trim().max(120).refine(isServiceArea, 'Choose a municipality in Oriental Mindoro').optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const requestStatusSchema = z.object({
  status: z.enum(['on_the_way', 'arrived', 'in_progress', 'completed']),
  note: z.string().trim().max(500).optional(),
  diagnosisNotes: z.string().trim().max(4000).optional(),
  partsUsed: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        qty: z.coerce.number().min(1).max(999),
        cost: z.coerce.number().min(0).max(1000000),
      })
    )
    .max(30)
    .optional(),
  finalCost: z.coerce.number().min(0).max(1000000).optional(),
});

export const cancelRequestSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const declineRequestSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});