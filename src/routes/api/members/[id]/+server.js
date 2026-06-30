import { json, error } from '@sveltejs/kit';
import { getMemberPublicData } from '$lib/server/member.js';
import {
	getProfileById,
	updateProfile,
	getProfileByUserId,
	isProfileComplete,
	serializeProfile
} from '$lib/server/profiles.js';
import { awardPoints } from '$lib/server/rewards.js';
import { requireUser } from '$lib/server/guards.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// GET /api/members/{id} -> { profile, submissions, badges, points }
export async function GET({ params, locals }) {
	try {
		const data = await getMemberPublicData(params.id, {
			viewerId: locals.user?.$id ?? null,
			isAdmin: !!locals.isAdmin
		});
		if (!data.found || !data.visible) throw error(404, 'Member not found.');
		return json({
			profile: data.profile,
			submissions: data.submissions,
			badges: data.badges,
			points: data.points
		});
	} catch (err) {
		return jsonError(err);
	}
}

// PATCH /api/members/{id} { bio, genres, links, photo_url, is_public } -> { profile }
export async function PATCH({ params, locals, request }) {
	try {
		requireUser(locals);
		const profile = await getProfileById(params.id);
		if (!profile) throw error(404, 'Profile not found.');
		if (profile.user_id !== locals.user.$id)
			throw error(403, 'You can only edit your own profile.');

		const body = await readJson(request);
		await updateProfile(locals.user.$id, body);
		const updated = await getProfileByUserId(locals.user.$id);

		if (isProfileComplete(updated)) {
			await awardPoints({
				userId: locals.user.$id,
				actionKey: 'profile_completion',
				sourceType: 'profile',
				sourceId: updated.$id,
				notes: 'Completed profile'
			});
		}
		return json({ profile: serializeProfile(updated) });
	} catch (err) {
		return jsonError(err);
	}
}
