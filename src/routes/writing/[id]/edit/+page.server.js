import { error, fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guards.js';
import { getSubmission, updateSubmission } from '$lib/server/submissions.js';
import { uploadSubmissionImage } from '$lib/server/storage.js';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '$lib/constants.js';

async function loadOwnedSubmission(id, locals) {
	let row;
	try {
		row = await getSubmission(id);
	} catch (err) {
		if (err?.code === 404) throw error(404, 'This piece could not be found.');
		throw err;
	}
	if (row.user_id !== locals.user.$id) throw error(403, 'You can only edit your own pieces.');
	return row;
}

export async function load({ params, locals }) {
	requireUser(locals);
	const row = await loadOwnedSubmission(params.id, locals);

	return {
		id: row.$id,
		values: {
			title: row.title,
			summary: row.summary ?? '',
			content_type: row.content_type,
			external_url: row.external_url ?? ''
		},
		currentImage: row.image_url ?? '',
		types: CONTENT_TYPES.map((t) => ({ key: t, label: CONTENT_TYPE_LABELS[t] }))
	};
}

export const actions = {
	default: async ({ request, params, locals }) => {
		requireUser(locals);
		const fd = await request.formData();
		const values = {
			title: fd.get('title'),
			summary: fd.get('summary'),
			content_type: fd.get('content_type'),
			external_url: fd.get('external_url')
		};

		// Optional replacement cover image.
		let imageUrl = '';
		const image = fd.get('image');
		if (image && typeof image.arrayBuffer === 'function' && image.size) {
			try {
				({ url: imageUrl } = await uploadSubmissionImage(image));
			} catch (err) {
				return fail(400, { error: err.message || 'Could not upload image.', values });
			}
		}

		try {
			await updateSubmission(params.id, locals.user.$id, { ...values, image_url: imageUrl });
		} catch (err) {
			return fail(err?.status === 403 ? 403 : 400, {
				error: err.message || 'Could not save changes.',
				values
			});
		}
		throw redirect(303, `/writing/${params.id}`);
	}
};
