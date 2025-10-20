import { z } from 'zod';

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['Pending', 'In Progress', 'Done']).optional(),
  assignedTo: z.string().optional(),
});

export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
