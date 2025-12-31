import { z } from 'zod';

export const createEmployeeSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
});

export const updateEmployeeSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  isActive: z.boolean().optional(),
});

export const employeesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(5000).default(10),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(5000).default(10),
  userId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['CHECKED_IN', 'CHECKED_OUT']).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeesQuery = z.infer<typeof employeesQuerySchema>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
