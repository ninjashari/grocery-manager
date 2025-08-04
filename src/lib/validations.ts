import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const signInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const receiptUploadSchema = z.object({
  vendor: z.string().min(1, 'Vendor is required'),
  date: z.string().min(1, 'Date is required'),
  total: z.number().positive('Total must be positive'),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    category: z.string().optional().default('Other'),
  }))
})

export const inventoryItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  lowStockThreshold: z.number().min(0, 'Threshold cannot be negative').optional().default(2),
})

export const shoppingListSchema = z.object({
  name: z.string().min(1, 'List name is required'),
})

export const shoppingListItemSchema = z.object({
  productId: z.string().optional(),
  customName: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
}).refine((data) => data.productId || data.customName, {
  message: "Either product or custom name is required",
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ReceiptUploadInput = z.infer<typeof receiptUploadSchema>
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>
export type ShoppingListInput = z.infer<typeof shoppingListSchema>
export type ShoppingListItemInput = z.infer<typeof shoppingListItemSchema>