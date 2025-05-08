import { useLoaderData, type ClientLoaderFunctionArgs } from "@remix-run/react";
import { useState } from "react";
import type { Run } from "../tracker/run";
import type { Talent } from "../tracker/talent";
import type { Event } from "../tracker/event";
import got from "got";

const twitchNameRegex = /^https?:\/\/(www\.)?twitch\.tv\/([^\/]+)\/?/;
const processTwitchUrl = (urlString: string) => {
	const match = urlString.match(twitchNameRegex);
	return match?.[2] ?? "???";
};

const apiUrl = "https://tracker.rpglimitbreak.com";

const cache: {
	runs: Run[] | null;
	runners: Talent[] | null;
	events: Event[] | null;
	timestamp: number;
} = {
	runs: null,
	runners: null,
	events: null,
	timestamp: 0,
};

type ResponseType<T> = {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
};

const requestResource = async <T,>(url: string) => {
	return got.paginate.all<T, ResponseType<T>>(url, {
		responseType: "json",
		pagination: {
			transform: ({ body }) => {
				return body.results;
			},
			paginate: ({ response: { body } }) => {
				if (!body.next) {
					return false;
				}
				return {
					url: new URL(body.next),
				};
			},
		},
	});
};

const fetchApiWithCache = async (eventId: string) => {
	if (cache.runs && cache.runners && Date.now() - cache.timestamp < 60_000) {
		return { runs: cache.runs, runners: cache.runners, events: cache.events };
	}

	const runsUrl = new URL(`/api/v2/events/${eventId}/runs`, apiUrl);

	const runnersUrl = new URL(`/api/v2/events/${eventId}/talent`, apiUrl);

	const eventsUrl = new URL("/api/v2/events", apiUrl);

	const [runs, runners, events] = await Promise.all([
		requestResource<Run>(runsUrl.href),
		requestResource<Talent>(runnersUrl.href),
		requestResource<Event>(eventsUrl.href),
	]);

	cache.runs = runs;
	cache.runners = runners;
	cache.events = events;
	cache.timestamp = Date.now();

	return { runs, runners, events };
};

export const loader = async ({ params }: ClientLoaderFunctionArgs) => {
	const eventId = params["eventId"];
	if (!eventId) {
		throw new Error("Event ID is required");
	}
	const data = await fetchApiWithCache(eventId);
	const runners = data.runners
		.map((runner) => ({
			id: runner.id,
			name: runner.name,
			pronouns: runner.pronouns,
			runs: data.runs
				.filter((run) => run.runners.some((r) => r.id === runner.id))
				.map((run) => run.name),
			twitter: runner.twitter,
			twitch:
				runner.platform === "TWITCH"
					? runner.stream
						? processTwitchUrl(runner.stream)
						: null
					: null,
			youtube: runner.platform === "YOUTUBE" ? runner.stream : runner.youtube,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
	const eventName = data.events?.find(
		(event) => event.id === parseInt(eventId, 10),
	)?.name;

	return { eventName, runners };
};

export default function EventRoute() {
	const data = useLoaderData<typeof loader>();

	const [searchText, setSearchText] = useState("");

	const filteredRunners = data.runners.filter((runner) =>
		[runner.name, ...runner.runs].some((text) =>
			text.toLowerCase().includes(searchText.toLowerCase()),
		),
	);

	return (
		<div
			style={{
				fontFamily: "sans-serif",
				padding: "8px",
				display: "grid",
				placeContent: "start",
				gap: "8px",
			}}
		>
			<h1 style={{ margin: 0, fontSize: "24px" }}>{data.eventName}</h1>
			<input
				type="text"
				placeholder="Search by names, game titles..."
				value={searchText}
				onChange={(e) => {
					setSearchText(e.target.value);
				}}
				style={{ justifySelf: "stretch" }}
			/>
			<table style={{ borderCollapse: "collapse", border: "2px solid black" }}>
				<thead>
					<tr>
						<th style={{ border: "1px solid black", padding: "4px" }}>Name</th>
						<th style={{ border: "1px solid black", padding: "4px" }}>
							Pronouns
						</th>
						<th style={{ border: "1px solid black", padding: "4px" }}>
							Twitter
						</th>
						<th style={{ border: "1px solid black", padding: "4px" }}>
							Twitch
						</th>
						<th style={{ border: "1px solid black", padding: "4px" }}>
							YouTube
						</th>
					</tr>
				</thead>
				<tbody>
					{filteredRunners.map((runner) => (
						<tr key={runner.id}>
							<td style={{ border: "1px solid black", padding: "4px" }}>
								{runner.name}
							</td>
							<td style={{ border: "1px solid black", padding: "4px" }}>
								{runner.pronouns}
							</td>
							<td style={{ border: "1px solid black", padding: "4px" }}>
								{runner.twitter}
							</td>
							<td style={{ border: "1px solid black", padding: "4px" }}>
								{runner.twitch}
							</td>
							<td style={{ border: "1px solid black", padding: "4px" }}>
								{runner.youtube}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
