import { WorkerEntrypoint } from 'cloudflare:workers';
import app from './hono/app';
import { initDatabase } from '@repo/data-ops/database';

export default class DataService extends WorkerEntrypoint<Env> {

	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env);
		initDatabase(env.DB);
	}
	fetch(request: Request) {
		return app.fetch(request, this.env, this.ctx)
	}
	async queue(batch: MessageBatch<unknown>) {
		for (const message of batch.messages) {
			console.log("Queue event:", message.body);
		}
	}
}
