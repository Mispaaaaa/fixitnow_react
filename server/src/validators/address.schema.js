import { z } from 'zod';

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(80),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(1).max(120),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  isDefault: z.boolean().optional().default(false),
});

export const addressUpdateSchema = addressSchema.partial();