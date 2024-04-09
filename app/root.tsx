import "modern-normalize";

import type { MetaFunction } from "@remix-run/node";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";

export const meta: MetaFunction = () => [
	{ charSet: "utf-8" },
	{ name: "viewport", content: "width=device-width, initial-scale=1" },
];

export default function Root() {
	return (
		<html>
			<head>
				<title>RPGLB Runner Info</title>
				<Meta />
				<Links />
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
