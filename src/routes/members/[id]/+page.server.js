import { error } from '@sveltejs/kit';
import { getMemberPublicData } from '$lib/server/member.js';

export async function load({ params, locals }) {
	const data = await getMemberPublicData(params.id, {
		viewerId: locals.user?.$id ?? null,
		isAdmin: !!locals.isAdmin
	});
	if (!data.found || !data.visible) throw error(404, 'This member could not be found.');

	return {
		member: data.profile,
		submissions: data.submissions,
		badges: data.badges,
		points: data.points,
		listed: data.listed,
		isOwner: locals.user?.$id === data.profile.user_id
	};
}
