import { json } from '@sveltejs/kit';
import { moderateSubmission, getSubmission, serializeSubmission } from '$lib/server/submissions.js';
import { requireAdmin } from '$lib/server/guards.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// PATCH /api/admin/submissions/{id} { status, moderation_note, featured } -> { submission }
export async function PATCH({ params, locals, request }) {
	try {
		requireAdmin(locals);
		const body = await readJson(request);
		await moderateSubmission(params.id, {
			status: body.status,
			featured: body.featured,
			note: body.moderation_note,
			adminId: locals.user.$id
		});
		const updated = await getSubmission(params.id);
		return json({ submission: serializeSubmission(updated) });
	} catch (err) {
		return jsonError(err);
	}
}
