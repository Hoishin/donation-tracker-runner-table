import { z } from "zod";
import { talentSchema } from "./talent";

export const runSchema = z.object({
	id: z.number(),
	type: z.literal("speedrun"),
	name: z.string(),
	display_name: z.string(),
	twitch_name: z.string(),
	description: z.string(),
	category: z.string().nullable(),
	coop: z.boolean(),
	onsite: z.enum(["ONSITE", "ONLINE", "HYBRID"]),
	console: z.string(),
	release_year: z.number().nullable(),
	runners: z.array(talentSchema),
	hosts: z.array(talentSchema),
	commentators: z.array(talentSchema),
	starttime: z.coerce.date().nullable(),
	endtime: z.coerce.date().nullable(),
	order: z.number().nullable(),
	tech_notes: z.string().optional(),
	layout: z.string(),
	run_time: z.string(),
	setup_time: z.string(),
	anchor_time: z.coerce.date().nullable(),
	video_links: z.array(
		z.object({
			id: z.number(),
			link_type: z.string(),
			url: z.string(),
		}),
	),
	priority_tag: z.string().nullable(),
	tags: z.array(z.string()),
});

export type Run = z.infer<typeof runSchema>;
