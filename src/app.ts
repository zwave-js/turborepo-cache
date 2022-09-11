import { missing, ThrowableRouter, withParams } from "itty-router-extras";
import { clientError, RequestWithProps, safeCompare } from "./lib/shared";
import type { CloudflareEnvironment } from "./worker";

function key(team: string, hash: string): string {
	return `artifact:${team}:${hash}`;
}

export function build(): ThrowableRouter {
	const router = ThrowableRouter();

	// Ensure that the request is authorized
	router.all("*", (req: Request, env: CloudflareEnvironment) => {
		const authorization = req.headers.get("authorization") ?? "";
		if (!safeCompare(`Bearer ${env.SECRET_TOKEN}`, authorization)) {
			return clientError("Unauthorized", 401);
		}
	});

	router.get(
		"/v8/artifacts/:hash",
		withParams,
		async (
			req: RequestWithProps<
				[
					{ params: { hash: string } },
					{ query: Record<string, string> }
				]
			>,
			env: CloudflareEnvironment
		) => {
			const team = req.query.slug;
			if (!team) {
				return clientError("No team specified", 401);
			} else if (!/[a-zA-Z\-_0-9]+/.test(team)) {
				return clientError("Invalid team specified", 401);
			}

			const artifactKey = key(team, req.params.hash);
			const artifact = await env.TURBO_CACHE.get(artifactKey, {
				cacheTtl: 3600,
				type: "stream",
			});

			if (!artifact) {
				return clientError("Artifact not found", 404);
			} else {
				return new Response(artifact);
			}
		}
	);

	router.put(
		"/v8/artifacts/:hash",
		withParams,
		async (
			req: RequestWithProps<
				[
					{ params: { hash: string } },
					{ query: Record<string, string> }
				]
			>,
			env: CloudflareEnvironment
		) => {
			const team = req.query.slug;
			if (!team) {
				return clientError("No team specified", 401);
			} else if (!/[a-zA-Z\-_0-9]+/.test(team)) {
				return clientError("Invalid team specified", 401);
			}

			if (!req.body) {
				return clientError("Cannot store empty artifacts", 400);
			}

			// Store the value in KV for 14 days
			const artifactKey = key(team, req.params.hash);
			await env.TURBO_CACHE.put(artifactKey, req.body, {
				expirationTtl: 14 * 24 * 60 * 60,
			});

			// And signal success
			return new Response(null, { status: 204 });
		}
	);

	router.all(
		"/v8/artifacts/:hash",
		(req: Request, _env: CloudflareEnvironment) => {
			return clientError(`Method ${req.method} not allowed`, 405);
		}
	);

	router.post("/v8/artifact/events", (_req: Request) => {
		// Ignore
		return new Response(null, { status: 200 });
	});

	router.all("*", () => missing());

	return router;
}
