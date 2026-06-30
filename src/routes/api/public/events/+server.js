import { json } from '@sveltejs/kit';
import { listUpcomingEvents } from '$lib/server/events.js';
import { jsonError } from '$lib/server/respond.js';

// GET /api/public/events -> [{ id, title, start_at, location, external_url }]
export async function GET() {
	try {
		const events = await listUpcomingEvents(12);
		return json(
			events.map((e) => ({
				id: e.$id,
				title: e.title,
				start_at: e.start_at ?? null,
				location: e.location ?? '',
				external_url: e.external_url ?? ''
			}))
		);
	} catch (err) {
		return jsonError(err);
	}
}
