import { json } from '@sveltejs/kit';
import { getHomeData } from '$lib/server/home.js';
import { jsonError } from '$lib/server/respond.js';

// GET /api/public/home -> { hero, featuredMembers, featuredWriting, siteCopy }
export async function GET() {
	try {
		return json(await getHomeData());
	} catch (err) {
		return jsonError(err);
	}
}
