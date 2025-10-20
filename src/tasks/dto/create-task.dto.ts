import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
