import { z } from 'zod';

// Common API Request/Response schemas

export const loginRequestSchema = z.object({
  email: z.string().email().required(),
  password: z.string().min(8).required(),
  otp?: z.string().min(6).max(6).optional()
});

// Salon admin creation schema

export const createSalonAdminSchema = z.object({
  email: z.string().email().required(),
  password: z.string().min(8).required(),
  salon_id: z.string().uuid().required()
});

// Booking request schema

export const createBookingSchema = z.object({
  salon_id: z.string().uuid().required(),
  service_id: z.string().uuid().required(),
  user_id: z.string().uuid().required(),
  date: z.date().required(),
  duration: z.number().positive().integer().min(15).max(120).required(),
  payment_method: z.enum(['credit_card', 'cash']).required()
});

// Salon update schema

export const updateSalonSchema = z.object({
  name: z.string().min(3).max(100).required(),
  location: z.string().uri().required(),
  description: z.string().optional(),
  pricing: z.object({
    standard: z.number().positive().required(),
    premium: z.number().positive().optional()
  }).required()
});

// Error response schema

export const errorResponseSchema = z.object({
  success: z.boolean().required(),
  message: z.string().required(),
  error_code: z.string().optional()
});