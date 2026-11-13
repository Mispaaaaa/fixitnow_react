import { z } from 'zod';

export const createConversationSchema = z
  .object({
    requestId: z.coerce.number().int().positive().optional(),
    technicianId: z.coerce.number().int().positive().optional(),
  })
  .refine((value) => {
    const hasRequest = value.requestId !== undefined;
    const hasTechnician = value.technicianId !== undefined;
    return hasRequest !== hasTechnician;
  }, {
    message: 'Choose either a service request or a technician',
  });

export const messageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});