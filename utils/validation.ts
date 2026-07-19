import { z } from 'zod';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .regex(EMAIL_PATTERN, 'Enter a valid email address');

const newPasswordField = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(256, 'Password is too long');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const PHONE_PATTERN = /^\d{6,14}$/;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(64, 'Too long'),
    lastName: z.string().trim().min(1, 'Last name is required').max(64, 'Too long'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required')
      .regex(PHONE_PATTERN, 'Enter 6-14 digits, numbers only'),
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: emailField });
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidIntervalDays(value: string): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 365;
}
