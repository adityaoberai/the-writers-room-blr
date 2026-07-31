import { json } from '@sveltejs/kit';
import { getRewardsSummary } from '$lib/server/rewards.js';
import { requireUser } from '$lib/server/guards.js';
import { jsonError } from '$lib/server/respond.js';

// GET /api/rewards/summary -> { badges, metrics }
export async function GET({ locals }) {
	try {
		requireUser(locals);
		const summary = await getRewardsSummary(locals.user.$id);
		return json({
			badges: summary.earned_badges,
			metrics: summary.metrics
		});
	} catch (err) {
		return jsonError(err);
	}
}
