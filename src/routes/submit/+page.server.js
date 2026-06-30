import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guards.js';
import { createSubmission } from '$lib/server/submissions.js';
import { awardPoints } from '$lib/server/rewards.js';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '$lib/constants.js';

export function load({ locals }) {
	requireUser(locals);
	return { types: CONTENT_TYPES.map((t) => ({ key: t, label: CONTENT_TYPE_LABELS[t] })) };
}

export const actions = {
	default: async ({ request, locals }) => {
		requireUser(locals);
		const fd = await request.formData();
		const values = {
			title: fd.get('title'),
			summary: fd.get('summary'),
			content_type: fd.get('content_type'),
			body: fd.get('body'),
			external_url: fd.get('external_url'),
			tags: fd.get('tags')
		};
		let submission;
		try {
			submission = await createSubmission(locals.user.$id, values);
		} catch (err) {
			return fail(400, { error: err.message || 'Could not submit.', values });
		}
		await awardPoints({
			userId: locals.user.$id,
			actionKey: 'submission',
			sourceType: 'submission',
			sourceId: submission.$id,
			notes: submission.title
		});
		throw redirect(303, `/writing/${submission.$id}`);
	}
};
