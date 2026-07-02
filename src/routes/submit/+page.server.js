import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guards.js';
import { createSubmission } from '$lib/server/submissions.js';
import { uploadSubmissionImage } from '$lib/server/storage.js';
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
			external_url: fd.get('external_url')
		};

		// Optional cover image: upload first so its URL can be stored on the row.
		let imageUrl = '';
		const image = fd.get('image');
		if (image && typeof image.arrayBuffer === 'function' && image.size) {
			try {
				({ url: imageUrl } = await uploadSubmissionImage(image));
			} catch (err) {
				return fail(400, { error: err.message || 'Could not upload image.', values });
			}
		}

		let submission;
		try {
			submission = await createSubmission(locals.user.$id, { ...values, image_url: imageUrl });
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
