import { requireUser } from '$lib/server/guards.js';
import { getRewardsSummary } from '$lib/server/rewards.js';

export async function load({ locals }) {
	requireUser(locals);
	return { summary: await getRewardsSummary(locals.user.$id) };
}
