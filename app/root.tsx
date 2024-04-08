import "modern-normalize";
import "./styles.css";

import { Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

export default function Root() {
	return (
		<html>
			<head>
				<title>RPGLB Runner Info</title>
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
