import { json } from '@sveltejs/kit';
import {
	listPublicSubmissions,
	createSubmission,
	serializeSubmission
} from '$lib/server/submissions.js';
import { getAuthorsForUserIds } from '$lib/server/profiles.js';
import { withSubmissionPreviewImages } from '$lib/server/link-preview.js';
import { awardPoints } from '$lib/server/rewards.js';
import { requireUser } from '$lib/server/guards.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// GET /api/submissions -> [{ id, title, summary, content_type, author, status, preview_image }]
export async function GET() {
	try {
		const rows = await listPublicSubmissions({ limit: 60 });
		const authors = await getAuthorsForUserIds(rows.map((r) => r.user_id));
		const submissions = await withSubmissionPreviewImages(
			rows.map((r) => serializeSubmission(r, { author: authors[r.user_id] ?? null }))
		);
		return json(
			submissions.map((s) => {
				return {
					id: s.id,
					title: s.title,
					summary: s.summary,
					content_type: s.content_type,
					author: s.author,
					status: s.status,
					preview_image: s.preview_image,
					tags: s.tags
				};
			})
		);
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
