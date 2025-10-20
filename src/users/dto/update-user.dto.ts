import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['Admin', 'Developer']).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
