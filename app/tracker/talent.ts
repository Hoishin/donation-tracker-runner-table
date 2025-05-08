import { z } from "zod";

export const talentSchema = z.object({
	type: z.literal("talent"),
	id: z.number(),
	name: z.string(),
	stream: z.string(),
	twitter: z.string(),
	youtube: z.string(),
	platform: z.string(),
	pronouns: z.string(),
});

export type Talent = z.infer<typeof talentSchema>;
