import { json } from '@sveltejs/kit';
import { setProfileListed } from '$lib/server/profiles.js';
import { requireAdmin } from '$lib/server/guards.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// POST /api/admin/members/{id}/approve { listed?: bool, approved?: bool } -> { profile_id, listed }
// Members are listed by default; this toggles admin listing. `approved`/`listed:false`
// unlists, anything else lists.
export async function POST({ params, locals, request }) {
	try {
		requireAdmin(locals);
		const body = await readJson(request);
		const listed = body.listed ?? body.approved;
		const shouldList = listed !== false;
		await setProfileListed(params.id, shouldList);
		return json({ profile_id: params.id, listed: shouldList });
	} catch (err) {
		return jsonError(err);
	}
}
