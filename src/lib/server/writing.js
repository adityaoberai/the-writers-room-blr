/**
 * Public "Writings" listing: turns a filter/cursor request into serialized,
 * preview-image-resolved cards, and builds the filter dropdown options. Shared by
 * the /writing page load and the /api/submissions endpoint so both stay in sync.
 */
import { listWritingPage, getWritingFacets, serializeSubmission } from './submissions.js';
import { getAuthorsForUserIds } from './profiles.js';
import { withSubmissionPreviewImages } from './link-preview.js';

export const WRITING_PAGE_SIZE = 24;

/** A page of writing cards for the given filters: `{ items, total, nextCursor }`. */
export async function getWritingListing(params = {}) {
	const { rows, total, nextCursor } = await listWritingPage({
		...params,
		limit: WRITING_PAGE_SIZE
	});
	const authors = await getAuthorsForUserIds(rows.map((r) => r.user_id));
	const items = await withSubmissionPreviewImages(
		rows.map((r) => serializeSubmission(r, { author: authors[r.user_id] ?? null }))
	);
	return { items, total, nextCursor };
}

/** Dropdown options: content types present, tags, and authors (id + name). */
export async function getWritingFacetOptions() {
	const { types, tags, userIds } = await getWritingFacets();
	const authors = await getAuthorsForUserIds(userIds);
	return {
		types,
		tags,
		authors: userIds
			.map((id) => ({ id, name: authors[id]?.display_name ?? '' }))
			.filter((a) => a.name)
			.sort((a, b) => a.name.localeCompare(b.name))
	};
}
