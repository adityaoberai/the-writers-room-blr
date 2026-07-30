import { listDirectory } from '$lib/server/profiles.js';
import { getBadgeCountsForUsers } from '$lib/server/rewards.js';

export async function load({ url }) {
	const search = url.searchParams.get('search') ?? '';
	const genre = url.searchParams.get('genre') ?? '';
	const { members, genres } = await listDirectory({ search, genre });
	const sealCounts = await getBadgeCountsForUsers(members.map((m) => m.user_id));
	return {
		members: members.map((m) => ({ ...m, seals: sealCounts[m.user_id] ?? 0 })),
		genres,
		search,
		genre
	};
}
