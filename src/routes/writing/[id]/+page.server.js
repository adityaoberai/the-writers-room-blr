import { error } from '@sveltejs/kit';
import { getSubmission, serializeSubmission } from '$lib/server/submissions.js';
import { getAuthorsForUserIds } from '$lib/server/profiles.js';
import { withSubmissionPreviewImages } from '$lib/server/link-preview.js';

const PUBLIC = ['approved', 'featured'];

export async function load({ params, locals }) {
	let row;
	try {
		row = await getSubmission(params.id);
	} catch (err) {
		if (err?.code === 404) throw error(404, 'This piece could not be found.');
		throw err;
	}

	const isOwner = locals.user?.$id === row.user_id;
	const canView = PUBLIC.includes(row.status) || isOwner || locals.isAdmin;
	if (!canView) throw error(404, 'This piece could not be found.');

	const authors = await getAuthorsForUserIds([row.user_id]);
	const [submission] = await withSubmissionPreviewImages([
		serializeSubmission(row, {
			author: authors[row.user_id] ?? null,
			includeBody: true
		})
	]);

	return { submission, isPublic: PUBLIC.includes(row.status) };
}
