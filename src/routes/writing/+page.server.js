import { listPublicSubmissions, serializeSubmission } from '$lib/server/submissions.js';
import { getAuthorsForUserIds } from '$lib/server/profiles.js';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '$lib/constants.js';

export async function load() {
	const rows = await listPublicSubmissions({ limit: 100 });
	const authors = await getAuthorsForUserIds(rows.map((r) => r.user_id));

	// Every approved piece is returned; searching, type-filtering and sorting all
	// happen client-side so they compose instantly without a round-trip.
	const submissions = rows.map((r) =>
		serializeSubmission(r, { author: authors[r.user_id] ?? null })
	);

	return {
		submissions,
		types: CONTENT_TYPES.map((t) => ({ key: t, label: CONTENT_TYPE_LABELS[t] }))
	};
}
