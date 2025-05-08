import { z } from "zod";

export const eventSchema = z.object({
	id: z.number(),
	type: z.literal("event"),
	short: z.string(),
	name: z.string(),
	hashtag: z.string(),
	datetime: z.coerce.date(),
	timezone: z.string(),
	receivername: z.string(),
	receiver_short: z.string(),
	receiver_solicitation_text: z.string(),
	receiver_logo: z.string(),
	receiver_privacy_policy: z.string(),
	paypalcurrency: z.string(),
	use_one_step_screening: z.boolean(),
	allow_donations: z.boolean(),
	locked: z.boolean(),
	amount: z.number().optional(),
	donation_count: z.number().optional(),
});

export type Event = z.infer<typeof eventSchema>;
