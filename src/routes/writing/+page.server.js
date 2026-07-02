import {
	getWritingListing,
	getWritingFacetOptions,
	WRITING_PAGE_SIZE
} from '$lib/server/writing.js';
import { CONTENT_TYPE_LABELS } from '$lib/constants.js';

export async function load() {
	// First page (newest, unfiltered) is rendered server-side; the dropdowns and
	// "Load more" drive subsequent, server-filtered pages via /api/submissions.
	const [listing, facets] = await Promise.all([getWritingListing({}), getWritingFacetOptions()]);

	return {
		items: listing.items,
		total: listing.total,
		nextCursor: listing.nextCursor,
		pageSize: WRITING_PAGE_SIZE,
		facets: {
			types: facets.types.map((k) => ({ key: k, label: CONTENT_TYPE_LABELS[k] ?? k })),
			tags: facets.tags,
			authors: facets.authors
		}
	};
}
