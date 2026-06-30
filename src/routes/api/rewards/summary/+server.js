import { json } from '@sveltejs/kit';
import { getRewardsSummary } from '$lib/server/rewards.js';
import { requireUser } from '$lib/server/guards.js';
import { jsonError } from '$lib/server/respond.js';

// GET /api/rewards/summary -> { total_points, badges, activity_logs }
export async function GET({ locals }) {
	try {
		requireUser(locals);
		const summary = await getRewardsSummary(locals.user.$id);
		return json({
			total_points: summary.total_points,
			badges: summary.earned_badges,
			activity_logs: summary.activity_logs
		});
	} catch (err) {
		return jsonError(err);
	}
}
