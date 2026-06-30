import { getProfileByUserId, isProfileComplete } from '$lib/server/profiles.js';

/** Expose a small, safe user summary to every page for the header/footer. */
export async function load({ locals }) {
	if (!locals.user) return { user: null };

	const profile = await getProfileByUserId(locals.user.$id).catch(() => null);
	const name =
		profile?.display_name || locals.user.name || locals.user.email?.split('@')[0] || 'Member';

	return {
		user: {
			id: locals.user.$id,
			email: locals.user.email,
			name,
			photo_url: profile?.photo_url ?? '',
			isAdmin: !!locals.isAdmin,
			hasProfile: !!profile,
			profileComplete: isProfileComplete(profile),
			profileId: profile?.$id ?? null
		}
	};
}
