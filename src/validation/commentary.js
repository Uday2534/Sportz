import { z } from 'zod';

// query for listing commentaries with optional limit
export const listCommentaryQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional(),
});

// schema for creating a commentary entry
export const createCommentarySchema = z.object({
	minute: z.coerce.number().int().nonnegative(),
	sequence: z.coerce.number().int().nonnegative(),
	period: z.string().min(1),
	eventType: z.string().min(1),
	actor: z.string().min(1).optional(),
	team: z.string().min(1).optional(),
	message: z.string().min(1),
	metadata: z.record(z.string(), z.any()).optional(),
	tags: z.array(z.string()).optional(),
});
