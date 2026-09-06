import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guards.js';
import {
	displayNameOf,
	ensureProfile,
	hasDisplayName,
	parseLinks,
	saveProfileFromFormData,
	setProfilePhoto,
	isProfileComplete
} from '$lib/server/profiles.js';
import { listSubmissionsByUser } from '$lib/server/submissions.js';
import { uploadProfilePhoto } from '$lib/server/storage.js';
import { recomputeBadges } from '$lib/server/rewards.js';
import { CONTENT_TYPE_LABELS } from '$lib/constants.js';

export async function load({ locals }) {
	requireUser(locals);
	const [profile, submissions] = await Promise.all([
		ensureProfile(locals.user.$id, locals.user.name),
		listSubmissionsByUser(locals.user.$id)
	]);
	// Profile creation is not finished until a display name is chosen.
	if (!hasDisplayName(profile)) throw redirect(303, '/onboarding');

	return {
		profile: {
			id: profile.$id,
			display_name: displayNameOf(profile),
			bio: profile.bio ?? '',
			genres: profile.genres ?? [],
			location: profile.location ?? 'Bengaluru',
			is_public: !!profile.is_public,
			links: parseLinks(profile.links),
			photo_url: profile.photo_url ?? ''
		},
		complete: isProfileComplete(profile),
		submissions: submissions.map((s) => ({
			id: s.$id,
			title: s.title,
			status: s.status,
			content_type_label: CONTENT_TYPE_LABELS[s.content_type] ?? s.content_type,
			created_at: s.$createdAt
		}))
	};
}

export const actions = {
	save: async ({ request, locals }) => {
		requireUser(locals);
		const fd = await request.formData();
		try {
			await saveProfileFromFormData(locals.user.$id, fd);
			await recomputeBadges(locals.user.$id);
		} catch (err) {
			return fail(400, { error: err.message || 'Could not save profile.' });
		}
		return { success: 'Profile saved.' };
	},

	photo: async ({ request, locals }) => {
		requireUser(locals);
		const fd = await request.formData();
		try {
			const { url } = await uploadProfilePhoto(fd.get('photo'));
			await setProfilePhoto(locals.user.$id, url);
			return { success: 'Photo updated.', photo_url: url };
		} catch (err) {
			return fail(400, { error: err.message || 'Could not upload photo.' });
		}
	}
};
