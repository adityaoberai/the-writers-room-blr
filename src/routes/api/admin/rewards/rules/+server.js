import { json } from '@sveltejs/kit';
import { upsertRewardRule } from '$lib/server/rewards.js';
import { requireAdmin } from '$lib/server/guards.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// POST /api/admin/rewards/rules { action_key, points, is_active } -> { reward_rule }
export async function POST({ locals, request }) {
	try {
		requireAdmin(locals);
		const body = await readJson(request);
		const rule = await upsertRewardRule(body);
		return json({ reward_rule: rule });
	} catch (err) {
		return jsonError(err);
	}
}
