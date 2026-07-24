import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const otpSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  purpose: z.enum(['signup', 'login']),
})

export const campaignSchema = z.object({
  title: z.string().min(5, 'Title too short').max(120),
  description: z.string().min(20, 'Description too short').max(5000),
  category: z.enum([
    'BLOOD_DONATION',
    'MEDICAL_EMERGENCY',
    'ACADEMIC_FEES',
    'ORPHANAGE',
    'OLD_HOME',
    'COMMUNITY_SERVICE',
    'DISASTER_RELIEF',
    'STUDENT_WELFARE',
    'OTHER',
  ]),
  customCategory: z.string().max(60).optional(),
  goalAmount: z.number().positive().optional().nullable(),
  remainingAmount: z.number().positive().optional().nullable(),
  deadline: z.string().datetime(),
  bankName: z.string().min(2).max(100),
  accountTitle: z.string().min(2).max(100),
  accountNumber: z.string().min(4).max(30),
  iban: z.string().max(34).optional().nullable(),
  mobileWallet: z.string().max(20).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  documentUrl: z.string().url().optional().nullable().or(z.literal('')),
})

export const updateSchema = z.object({
  content: z.string().min(5, 'Update too short').max(2000),
  remainingAmount: z.number().positive().optional().nullable(),
})

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500),
})

export const adminActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'remove']),
  reason: z.string().max(500).optional(),
})
