import { json } from '@sveltejs/kit';
import { listCurrentEvents, eventStatus } from '$lib/server/events.js';
import { jsonError } from '$lib/server/respond.js';

// GET /api/public/events -> [{ id, title, status, start_at, end_at, location, external_url }]
// Includes events that are on now (status: 'ongoing') as well as upcoming ones.
export async function GET() {
	try {
		const events = await listCurrentEvents(12);
		return json(
			events.map((e) => ({
				id: e.$id,
				title: e.title,
				status: eventStatus(e),
				start_at: e.start_at ?? null,
				end_at: e.end_at ?? null,
				location: e.location ?? '',
				external_url: e.external_url ?? ''
			}))
		);
	} catch (err) {
		return jsonError(err);
	}
}
