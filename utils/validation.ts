import { z } from 'zod';

export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'agent']),
  assignedTo: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const leadSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  customerEmail: z.string().email('Invalid email format'),
  alternateNumber: z.string().optional(),
  status: z.string().optional(),
  assignedAgent: z.string().optional(),
  productName: z.string().optional(),
  productAmount: z.number().optional(),
  quantity: z.number().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  mechanicName: z.string().optional(),
  contactPhone: z.string().optional(),
  state: z.string().optional(),
  zone: z.string().optional(),
  callType: z.string().optional()
});

export const vendorOrderSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required'),
  vendorLocation: z.string().min(1, 'Vendor location is required'),
  orderNo: z.string().min(1, 'Order number is required'),
  orderStatus: z.enum([
    'stage1 (engine pull)', 'stage2 (washing)', 'stage3 (testing)',
    'stage4 (pack & ready)', 'stage5 (shipping)', 'stage6 (delivered)'
  ]).optional()
});

export const targetSchema = z.object({
  title: z.string().min(1, 'Target title is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  assignedUsers: z.array(z.string()).optional()
});

export const paymentRecordSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  modeOfPayment: z.string().min(1, 'Payment mode is required'),
  salesPrice: z.number().positive('Sales price must be positive'),
  paymentDate: z.string().or(z.date())
});

// export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } {
//   try {
//     const validatedData = schema.parse(data);
//     return { success: true, data: validatedData };
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return { 
//         success: false, 
//         errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`) 
//       };
//     }
//     return { success: false, errors: ['Validation failed'] };
//   }
// }