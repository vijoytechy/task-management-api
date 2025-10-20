import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(3, 'Role name must be at least 3 characters long'),
  description: z.string().optional(),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
