import { json } from '@sveltejs/kit';
import { createSubmission } from '$lib/server/submissions.js';
import { getWritingListing } from '$lib/server/writing.js';
import { awardPoints } from '$lib/server/rewards.js';
import { requireUser } from '$lib/server/guards.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// GET /api/submissions?type&tag&author&search&sort&cursor -> { items, total, nextCursor }
// Server-side filtered + cursor-paginated feed for the public Writings page.
export async function GET({ url }) {
	try {
		const listing = await getWritingListing({
			type: url.searchParams.get('type') ?? '',
			tag: url.searchParams.get('tag') ?? '',
			authorId: url.searchParams.get('author') ?? '',
			search: url.searchParams.get('search') ?? '',
			sort: url.searchParams.get('sort') ?? 'newest',
			cursor: url.searchParams.get('cursor') ?? ''
		});
		return json(listing);
	} catch (err) {
		return jsonError(err);
	}
}

// POST /api/submissions { title, content_type, summary?, external_url?, tags? } -> { submission_id, status }
export async function POST({ locals, request }) {
	try {
		requireUser(locals);
		const body = await readJson(request);
		const submission = await createSubmission(locals.user.$id, body);
		await awardPoints({
			userId: locals.user.$id,
			actionKey: 'submission',
			sourceType: 'submission',
			sourceId: submission.$id,
			notes: submission.title
		});
		return json({ submission_id: submission.$id, status: submission.status }, { status: 201 });
	} catch (err) {
		return jsonError(err);
	}
}
