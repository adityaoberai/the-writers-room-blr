import { json } from '@sveltejs/kit';
import { listDirectory } from '$lib/server/profiles.js';
import { jsonError } from '$lib/server/respond.js';

// GET /api/members -> [{ profile_id, display_name, photo_url, genres, location, is_featured }]
// Optional filters: ?search=&genre=&focus=
export async function GET({ url }) {
	try {
		const { members } = await listDirectory({
			search: url.searchParams.get('search') ?? '',
			genre: url.searchParams.get('genre') ?? '',
			focus: url.searchParams.get('focus') ?? ''
		});
		return json(
			members.map((m) => ({
				profile_id: m.profile_id,
				display_name: m.display_name,
				photo_url: m.photo_url,
				genres: m.genres,
				location: m.location,
				is_featured: m.is_featured
			}))
		);
	} catch (err) {
		return jsonError(err);
	}
}
