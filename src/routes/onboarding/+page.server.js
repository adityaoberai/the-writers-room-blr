import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guards.js';
import {
	getProfileByUserId,
	ensureProfile,
	parseLinks,
	saveProfileFromFormData,
	setProfilePhoto,
	isProfileComplete
} from '$lib/server/profiles.js';
import { uploadProfilePhoto } from '$lib/server/storage.js';
import { awardPoints } from '$lib/server/rewards.js';

function formProfile(p) {
	return {
		display_name: p.display_name ?? '',
		bio: p.bio ?? '',
		genres: p.genres ?? [],
		location: p.location ?? 'Bengaluru',
		is_public: !!p.is_public,
		links: parseLinks(p.links),
		photo_url: p.photo_url ?? ''
	};
}

export async function load({ locals }) {
	requireUser(locals);
	const fallbackName = locals.user.name || locals.user.email?.split('@')[0] || 'New member';
	const profile = await ensureProfile(locals.user.$id, fallbackName);
	return { profile: formProfile(profile), email: locals.user.email };
}

export const actions = {
	save: async ({ request, locals }) => {
		requireUser(locals);
		const fd = await request.formData();
		try {
			await saveProfileFromFormData(locals.user.$id, fd);
		} catch (err) {
			return fail(400, { error: err.message || 'Could not save profile.' });
		}
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
		throw redirect(303, '/me');
	},

	photo: async ({ request, locals }) => {
		requireUser(locals);
		const fd = await request.formData();
		try {
			const { url } = await uploadProfilePhoto(fd.get('photo'));
			await setProfilePhoto(locals.user.$id, url);
			return { success: 'Photo updated.' };
		} catch (err) {
			return fail(400, { error: err.message || 'Could not upload photo.' });
		}
	}
};
