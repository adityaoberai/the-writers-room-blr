import { listDirectory } from '$lib/server/profiles.js';

export async function load({ url }) {
	const search = url.searchParams.get('search') ?? '';
	const genre = url.searchParams.get('genre') ?? '';
	const { members, genres } = await listDirectory({ search, genre });
	return { members, genres, search, genre };
}
