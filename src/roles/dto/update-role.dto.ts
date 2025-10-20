import { z } from 'zod';

export const updateRoleSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
});

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
