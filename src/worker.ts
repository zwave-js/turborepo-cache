import { build } from "./app";

export interface CloudflareEnvironment {
	SECRET_TOKEN: string;

	TURBO_CACHE: KVNamespace;
}

const router = build();

export default {
	async fetch(
		request: Request,
		env: CloudflareEnvironment,
		context: ExecutionContext
	): Promise<Response> {
		return router.handle(request, env, context);
	},
};
