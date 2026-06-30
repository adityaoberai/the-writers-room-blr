/** Admin dashboard aggregation, shared by /admin and /api/admin/dashboard. */
import { countRows, listAllRows, Query } from './data.js';
import { TABLES } from '$lib/constants.js';
import { submissionCounts, listPendingSubmissions, serializeSubmission } from './submissions.js';
import { listProfilesForModeration, getAuthorsForUserIds } from './profiles.js';
import { getRewardRules } from './rewards.js';

export async function getDashboardData() {
	const [
		usersTotal,
		active,
		suspended,
		profilesTotal,
		approved,
		featured,
		subCounts,
		moderationProfiles,
		pendingSubs,
		rules,
		allLogs,
		badgesEarned
	] = await Promise.all([
		countRows(TABLES.users),
		countRows(TABLES.users, [Query.equal('status', 'active')]),
		countRows(TABLES.users, [Query.equal('status', 'suspended')]),
		countRows(TABLES.profiles),
		countRows(TABLES.directory),
		countRows(TABLES.profiles, [Query.equal('is_featured', true)]),
		submissionCounts(),
		listProfilesForModeration(),
		listPendingSubmissions(50),
		getRewardRules(),
		listAllRows(TABLES.activityLogs),
		countRows(TABLES.userBadges)
	]);

	const authors = await getAuthorsForUserIds(pendingSubs.map((s) => s.user_id));
	const totalPointsAwarded = allLogs.reduce((s, l) => s + (l.points_awarded ?? 0), 0);

	// Members who need a manual approval decision: complete & public but not yet listed.
	const needsReview = moderationProfiles.filter(
		(m) => m.complete && m.profile.is_public && !m.approved
	);

	return {
		memberCounts: {
			total: usersTotal,
			active,
			suspended,
			profiles: profilesTotal,
			approved,
			featured
		},
		submissionCounts: subCounts,
		pendingQueues: {
			members: moderationProfiles,
			membersNeedingReview: needsReview.length,
			submissions: pendingSubs.map((s) =>
				serializeSubmission(s, { author: authors[s.user_id] ?? null })
			)
		},
		rewardStats: {
			rules,
			total_points_awarded: totalPointsAwarded,
			badges_awarded: badgesEarned
		}
	};
}
