import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guards.js';
import {
	ensureProfile,
	parseLinks,
	saveProfileFromFormData,
	setProfilePhoto,
	isProfileComplete
} from '$lib/server/profiles.js';
import { listSubmissionsByUser } from '$lib/server/submissions.js';
import { uploadProfilePhoto } from '$lib/server/storage.js';
import { awardProfileCompletion, getTotalPoints } from '$lib/server/rewards.js';
import { CONTENT_TYPE_LABELS } from '$lib/constants.js';

export async function load({ locals }) {
	requireUser(locals);
	const fallbackName = locals.user.name || locals.user.email?.split('@')[0] || 'New member';
	const [profile, submissions, points] = await Promise.all([
		ensureProfile(locals.user.$id, fallbackName),
		listSubmissionsByUser(locals.user.$id),
		getTotalPoints(locals.user.$id)
	]);

	return {
		profile: {
			id: profile.$id,
			display_name: profile.display_name ?? '',
			bio: profile.bio ?? '',
			genres: profile.genres ?? [],
			location: profile.location ?? 'Bengaluru',
			is_public: !!profile.is_public,
			links: parseLinks(profile.links),
			photo_url: profile.photo_url ?? ''
		},
		complete: isProfileComplete(profile),
		points,
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
		let updated;
		try {
			updated = await saveProfileFromFormData(locals.user.$id, fd);
		} catch (err) {
			return fail(400, { error: err.message || 'Could not save profile.' });
		}
		void awardProfileCompletion(locals.user.$id, updated).catch((err) => {
			console.error('Could not award profile completion points.', err);
		});
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
