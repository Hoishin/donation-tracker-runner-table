import { useLoaderData, type ClientLoaderFunctionArgs } from "@remix-run/react";
import ky from "ky";
import runSample from "../../sample/run.json";
import runnerSample from "../../sample/runner.json";
import eventSample from "../../sample/event.json";
import { useState } from "react";

const twitchNameRegex = /^https?:\/\/(www\.)?twitch\.tv\/([^\/]+)\/?/;
const processTwitchUrl = (urlString: string) => {
	const match = urlString.match(twitchNameRegex);
	return match?.[2] ?? "???";
};

const apiUrl = "https://tracker.rpglimitbreak.com/search/";

const cache: {
	runs: typeof runSample | null;
	runners: typeof runnerSample | null;
	events: typeof eventSample | null;
	timestamp: number;
} = {
	runs: null,
	runners: null,
	events: null,
	timestamp: 0,
};

const fetchApiWithCache = async (eventId: string) => {
	if (cache.runs && cache.runners && Date.now() - cache.timestamp < 60_000) {
		return { runs: cache.runs, runners: cache.runners, events: cache.events };
	}
	const runsUrl = new URL(apiUrl);
	runsUrl.searchParams.set("type", "run");
	runsUrl.searchParams.set("event", eventId);
	const runnersUrl = new URL(apiUrl);
	runnersUrl.searchParams.set("type", "runner");
	runnersUrl.searchParams.set("event", eventId);
	const eventsUrl = new URL(apiUrl);
	eventsUrl.searchParams.set("type", "event");
	const [runs, runners, events] = await Promise.all([
		ky.get(runsUrl.href).json<typeof runSample>(),
		ky.get(runnersUrl.href).json<typeof runnerSample>(),
		ky.get(eventsUrl.href).json<typeof eventSample>(),
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
			id: runner.pk,
			name: runner.fields.name,
			pronouns: runner.fields.pronouns,
			runs: data.runs
				.filter((run) => run.fields.runners.includes(runner.pk))
				.map((run) => run.fields.name),
			twitter: runner.fields.twitter,
			twitch:
				runner.fields.platform === "TWITCH"
					? runner.fields.stream
						? processTwitchUrl(runner.fields.stream)
						: null
					: null,
			youtube:
				runner.fields.platform === "YOUTUBE"
					? runner.fields.stream
					: runner.fields.youtube,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
	const eventName = data.events?.find(
		(event) => event.pk === parseInt(eventId, 10),
	)?.fields.name;

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
