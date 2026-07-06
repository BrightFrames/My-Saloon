import { z } from 'zod';

// Common API Request/Response schemas

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otp: z.string().min(6).max(6).optional(),
});

// Salon admin creation schema

export const createSalonAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  salon_id: z.string().uuid(),
});

// Booking request schema

export const createBookingSchema = z.object({
  salon_id: z.string().uuid(),
  service_id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.date(),
  duration: z.number().positive().int().min(15).max(120),
  payment_method: z.enum(['credit_card', 'cash']),
});

// Salon update schema

export const updateSalonSchema = z.object({
  name: z.string().min(3).max(100),
  location: z.string().url(),
  description: z.string().optional(),
  pricing: z.object({
    standard: z.number().positive(),
    premium: z.number().positive().optional(),
  }),
});

// Error response schema

export const errorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error_code: z.string().optional(),
});