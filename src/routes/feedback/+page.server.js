import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guards.js';
import { createFeedback } from '$lib/server/feedback.js';
import { uploadFeedbackAttachment } from '$lib/server/storage.js';
import { FEEDBACK_CATEGORIES, FEEDBACK_CATEGORY_LABELS } from '$lib/constants.js';

export function load({ locals }) {
	requireUser(locals);
	return {
		categories: FEEDBACK_CATEGORIES.map((c) => ({ key: c, label: FEEDBACK_CATEGORY_LABELS[c] }))
	};
}

export const actions = {
	default: async ({ request, locals }) => {
		requireUser(locals);
		const fd = await request.formData();
		const values = {
			category: fd.get('category'),
			message: fd.get('message'),
			page: fd.get('page')
		};

		// Optional screenshot/recording: upload first so its URL is on the row.
		let attachmentUrl = '';
		const attachment = fd.get('attachment');
		if (attachment && typeof attachment.arrayBuffer === 'function' && attachment.size) {
			try {
				({ url: attachmentUrl } = await uploadFeedbackAttachment(attachment));
			} catch (err) {
				return fail(400, { error: err.message || 'Could not upload the file.', values });
			}
		}

		try {
			await createFeedback(locals.user.$id, locals.user.email, {
				...values,
				attachment_url: attachmentUrl
			});
		} catch (err) {
			return fail(400, { error: err.message || 'Could not send your feedback.', values });
		}
		return { success: 'Thank you. Your note is with the team.' };
	}
};
