/** Public member-profile aggregation, shared by the page load and /api/members/{id}. */
import { getProfileById, serializeProfile, getAuthorsForUserIds } from './profiles.js';
import { listPublicSubmissionsByUser, serializeSubmission } from './submissions.js';
import { withSubmissionPreviewImages } from './link-preview.js';
import { getPublicRewards } from './rewards.js';

/**
 * Returns the public view of a member, or `{ found:false }` / `{ visible:false }`.
 * Owners and admins can always view; everyone else needs the profile to be
 * public (member's choice) and listed (not unlisted by an admin).
 */
export async function getMemberPublicData(profileId, { viewerId = null, isAdmin = false } = {}) {
	const profile = await getProfileById(profileId);
	if (!profile) return { found: false };

	const isOwner = viewerId && profile.user_id === viewerId;
	const surfaced = profile.is_public && profile.listed !== false;
	const visible = surfaced || isOwner || isAdmin;
	if (!visible)
		return { found: true, visible: false, profile: { display_name: profile.display_name } };

	const [subs, rewards] = await Promise.all([
		listPublicSubmissionsByUser(profile.user_id),
		getPublicRewards(profile.user_id)
	]);
	const authors = await getAuthorsForUserIds([profile.user_id]);
	const submissions = await withSubmissionPreviewImages(
		subs.map((s) => serializeSubmission(s, { author: authors[profile.user_id] ?? null }))
	);

	return {
		found: true,
		visible: true,
		listed: surfaced,
		profile: serializeProfile(profile),
		submissions,
		badges: rewards.badges,
		points: rewards.total_points
	};
}
