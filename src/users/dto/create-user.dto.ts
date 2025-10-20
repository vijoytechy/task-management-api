import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().min(6),
  role: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid MongoDB ObjectId'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
