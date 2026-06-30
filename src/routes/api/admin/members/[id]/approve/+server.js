import { json } from '@sveltejs/kit';
import { approveProfile } from '$lib/server/profiles.js';
import { requireAdmin } from '$lib/server/guards.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// POST /api/admin/members/{id}/approve { approved: true } -> { status, approved_at }
export async function POST({ params, locals, request }) {
	try {
		requireAdmin(locals);
		const body = await readJson(request);
		if (body.approved === false) {
			return json({ status: 'unchanged' });
		}
		const result = await approveProfile(params.id, locals.user.$id, body.tags ?? []);
		return json(result);
	} catch (err) {
		return jsonError(err);
	}
}
