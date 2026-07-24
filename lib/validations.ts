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
  title: z.string().trim().min(5, 'Title must be at least 5 characters long').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().trim().min(20, 'Description must be at least 20 characters long').max(5000, 'Description cannot exceed 5000 characters'),
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
  ], { message: 'Please select a valid campaign category' }),
  customCategory: z.string().trim().max(60, 'Custom category cannot exceed 60 characters').optional().nullable(),
  goalAmount: z.number().positive('Goal amount must be a positive number').max(10000000, 'Goal amount cannot exceed 10,000,000 PKR').optional().nullable(),
  remainingAmount: z.number().positive('Remaining amount must be a positive number').optional().nullable(),
  deadline: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Please select a valid deadline date' }),
  bankName: z.string().trim().min(2, 'Bank name must be at least 2 characters').max(100, 'Bank name cannot exceed 100 characters'),
  accountTitle: z.string().trim().min(2, 'Account title must be at least 2 characters').max(100, 'Account title cannot exceed 100 characters'),
  accountNumber: z.string().trim().min(4, 'Account number must be at least 4 digits').max(30, 'Account number cannot exceed 30 digits').regex(/^[0-9A-Za-z\s-]+$/, 'Account number contains invalid characters'),
  iban: z.string().trim().optional().nullable().refine(v => !v || /^PK[0-9A-Za-z]{22}$/i.test(v), {
    message: 'Invalid Pakistani IBAN format (e.g. PK36SCBL0000001123456702)',
  }),
  mobileWallet: z.string().trim().optional().nullable().refine(v => !v || /^(03[0-9]{9}|\+923[0-9]{9})$/.test(v), {
    message: 'Enter a valid mobile wallet number (e.g., 03001234567)',
  }),
  imageUrl: z.string().trim().optional().nullable().refine(v => !v || /^https?:\/\/.+/.test(v), {
    message: 'Please enter a valid image URL (e.g. https://...)',
  }),
  documentUrl: z.string().trim().optional().nullable().refine(v => !v || /^https?:\/\/.+/.test(v), {
    message: 'Please enter a valid document URL (e.g. https://...)',
  }),
  isAnonymous: z.boolean().optional().default(false),
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
