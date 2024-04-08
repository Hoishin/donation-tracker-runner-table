import { useLoaderData, type ClientLoaderFunctionArgs } from "@remix-run/react";
import ky from "ky";
import runSample from "../../sample/run.json";
import runnerSample from "../../sample/runner.json";

const twitchNameRegex = /^https?:\/\/(www\.)?twitch\.tv\/([^\/]+)\/?/;
const processTwitchUrl = (urlString: string) => {
	const match = urlString.match(twitchNameRegex);
	return match?.[2] ?? "???";
};

const apiUrl = "https://tracker.rpglimitbreak.com/search/";

const cache: {
	runs: typeof runSample | null;
	runners: typeof runnerSample | null;
	timestamp: number;
} = {
	runs: null,
	runners: null,
	timestamp: 0,
};

const fetchApiWithCache = async (eventId: string) => {
	if (cache.runs && cache.runners && Date.now() - cache.timestamp < 60_000) {
		return { runs: cache.runs, runners: cache.runners };
	}
	const runsUrl = new URL(apiUrl);
	runsUrl.searchParams.set("type", "run");
	runsUrl.searchParams.set("event", eventId);
	const runnersUrl = new URL(apiUrl);
	runnersUrl.searchParams.set("type", "runner");
	runnersUrl.searchParams.set("event", eventId);
	const [runs, runners] = await Promise.all([
		ky.get(runsUrl.href).json<typeof runSample>(),
		ky.get(runnersUrl.href).json<typeof runnerSample>(),
	]);
	cache.runs = runs;
	cache.runners = runners;
	cache.timestamp = Date.now();
	return { runs, runners };
};

export const loader = async ({ params }: ClientLoaderFunctionArgs) => {
	const eventId = params["eventId"];
	if (!eventId) {
		throw new Error("Event ID is required");
	}
	const { runs, runners } = await fetchApiWithCache(eventId);
	return runners.map((runner) => ({
		id: runner.pk,
		name: runner.fields.name,
		runs: runs
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
	}));
};

export default function EventRoute() {
	const data = useLoaderData<typeof loader>();

	return (
		<div style={{ padding: "8px" }}>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Twitter</th>
						<th>Twitch</th>
						<th>YouTube</th>
					</tr>
				</thead>
				<tbody>
					{data.map((runner) => (
						<tr key={runner.id}>
							<td>{runner.name}</td>
							<td>{runner.twitter}</td>
							<td>{runner.twitch}</td>
							<td>{runner.youtube}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
