import { listPublicSubmissions, serializeSubmission } from '$lib/server/submissions.js';
import { getAuthorsForUserIds } from '$lib/server/profiles.js';
import { withSubmissionPreviewImages } from '$lib/server/link-preview.js';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '$lib/constants.js';

export async function load({ url }) {
	const type = url.searchParams.get('type') ?? '';
	const rows = await listPublicSubmissions({ limit: 100 });
	const authors = await getAuthorsForUserIds(rows.map((r) => r.user_id));

	let submissions = rows.map((r) => serializeSubmission(r, { author: authors[r.user_id] ?? null }));
	if (type) submissions = submissions.filter((s) => s.content_type === type);
	submissions = await withSubmissionPreviewImages(submissions);

	return {
		submissions,
		type,
		types: CONTENT_TYPES.map((t) => ({ key: t, label: CONTENT_TYPE_LABELS[t] }))
	};
}
