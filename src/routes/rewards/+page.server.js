import { requireUser } from '$lib/server/guards.js';
import { getRewardsSummary, getRewardRules } from '$lib/server/rewards.js';
import { REWARD_ACTION_LABELS } from '$lib/constants.js';

export async function load({ locals }) {
	requireUser(locals);
	const [summary, rules] = await Promise.all([
		getRewardsSummary(locals.user.$id),
		getRewardRules()
	]);
	return {
		summary,
		rules: rules
			.filter((r) => r.is_active)
			.map((r) => ({
				action: r.action_key,
				label: REWARD_ACTION_LABELS[r.action_key],
				points: r.points
			}))
	};
}
