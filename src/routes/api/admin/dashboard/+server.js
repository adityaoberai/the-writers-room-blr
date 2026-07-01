import { json } from '@sveltejs/kit';
import { getDashboardData } from '$lib/server/admin.js';
import { requireAdmin } from '$lib/server/guards.js';
import { jsonError } from '$lib/server/respond.js';

// GET /api/admin/dashboard -> { memberCounts, submissionCounts, queues, rewardStats }
export async function GET({ locals }) {
	try {
		requireAdmin(locals);
		return json(await getDashboardData());
	} catch (err) {
		return jsonError(err);
	}
}
