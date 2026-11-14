import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guards.js';
import { getProfileByUserId, hasDisplayName } from '$lib/server/profiles.js';
import { createSubmission } from '$lib/server/submissions.js';
import { resolveSubmissionPreview } from '$lib/server/link-preview.js';
import { uploadSubmissionImage } from '$lib/server/storage.js';
import { recomputeBadges } from '$lib/server/rewards.js';
import { cleanString, ensureOneOf, optionalUrl, ValidationError } from '$lib/server/validation.js';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '$lib/constants.js';

function fillFromPreview(values, preview) {
	if (!preview) return values;
	return {
		...values,
		title: values.title || preview.title,
		summary: values.summary || preview.summary,
		content_type: values.content_type || preview.contentType
	};
}

export async function load({ locals }) {
	requireUser(locals);
	// Writing is credited to a display name, so one must exist before submitting.
	const profile = await getProfileByUserId(locals.user.$id);
	if (!hasDisplayName(profile)) throw redirect(303, '/onboarding');
	return { types: CONTENT_TYPES.map((t) => ({ key: t, label: CONTENT_TYPE_LABELS[t] })) };
}

export const actions = {
	default: async ({ request, locals }) => {
		requireUser(locals);
		const fd = await request.formData();
		let values = {
			title: cleanString(fd.get('title'), { max: 256 }),
			summary: cleanString(fd.get('summary'), { max: 1024 }),
			content_type: cleanString(fd.get('content_type'), { max: 32 }),
			external_url: cleanString(fd.get('external_url'), { max: 2048 })
		};
		const previewOnly = fd.get('intent') === 'preview';
		const image = fd.get('image');
		const hasUpload = image && typeof image.arrayBuffer === 'function' && image.size > 0;
		let preview = null;
		let submission;

		try {
			const externalUrl = optionalUrl(values.external_url, 'Link');
			if (previewOnly && !externalUrl) {
				throw new ValidationError('Paste a link to your writing to preview it.');
			}
			if (externalUrl && (previewOnly || !values.title || !values.content_type || !hasUpload)) {
				preview = await resolveSubmissionPreview(externalUrl);
			}

			const linkDetails = { values: fillFromPreview(values, preview), preview };
			if (previewOnly) {
				if (!preview?.title && !preview?.summary && !preview?.imageUrl && !preview?.contentType) {
					throw new ValidationError('We couldn’t read details from this link. Enter them below.');
				}
				if (!linkDetails.values.title) {
					return fail(400, {
						...linkDetails,
						error: 'We couldn’t find a title for this link. Add one below.'
					});
				}
				return linkDetails;
			}

			if (!values.title) values = linkDetails.values;
			if (!values.title) {
				throw new ValidationError(
					externalUrl
						? 'We couldn’t find a title for this link. Add one below.'
						: 'Enter a title or paste a link to your writing.'
				);
			}

			const contentType = ensureOneOf(
				values.content_type || preview?.contentType || 'blog',
				CONTENT_TYPES,
				'type'
			);
			const imageUrl = hasUpload ? (await uploadSubmissionImage(image)).url : preview?.imageUrl;
			submission = await createSubmission(locals.user.$id, {
				...values,
				content_type: contentType,
				image_url: imageUrl
			});
		} catch (err) {
			return fail(400, { error: err.message || 'Could not submit.', values, preview });
		}
		await recomputeBadges(locals.user.$id);
		throw redirect(303, `/writing/${submission.$id}`);
	}
};
