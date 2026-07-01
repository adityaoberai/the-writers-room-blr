/** Admin dashboard aggregation, shared by /admin and /api/admin/dashboard. */
import { countRows, listAllRows, Query } from './data.js';
import { TABLES } from '$lib/constants.js';
import { submissionCounts, listRecentSubmissions, serializeSubmission } from './submissions.js';
import { listProfilesForModeration, getAuthorsForUserIds } from './profiles.js';
import { getRewardRules } from './rewards.js';

export async function getDashboardData() {
	const [
		usersTotal,
		active,
		suspended,
		profilesTotal,
		featured,
		subCounts,
		moderationProfiles,
		recentSubs,
		rules,
		allLogs,
		badgesEarned,
		allUsers
	] = await Promise.all([
		countRows(TABLES.users),
		countRows(TABLES.users, [Query.equal('status', 'active')]),
		countRows(TABLES.users, [Query.equal('status', 'suspended')]),
		countRows(TABLES.profiles),
		countRows(TABLES.profiles, [Query.equal('is_featured', true)]),
		submissionCounts(),
		listProfilesForModeration(),
		listRecentSubmissions(100),
		getRewardRules(),
		listAllRows(TABLES.activityLogs),
		countRows(TABLES.userBadges),
		listAllRows(TABLES.users)
	]);

	// Admin authority is derived from the Auth `admin` label; the `users.role`
	// column mirrors it and is enough for the dashboard display.
	const roleByUser = new Map(allUsers.map((u) => [u.$id, u.role]));
	const members = moderationProfiles.map((m) => ({
		...m,
		is_admin: roleByUser.get(m.user_id) === 'admin'
	}));
	const listedCount = members.filter((m) => m.profile.is_public && m.listed).length;
	const unlistedCount = members.filter((m) => !m.listed).length;

	const authors = await getAuthorsForUserIds(recentSubs.map((s) => s.user_id));
	const totalPointsAwarded = allLogs.reduce((s, l) => s + (l.points_awarded ?? 0), 0);

	return {
		memberCounts: {
			total: usersTotal,
			active,
			suspended,
			profiles: profilesTotal,
			listed: listedCount,
			featured
		},
		submissionCounts: subCounts,
		queues: {
			members,
			unlisted: unlistedCount,
			submissions: recentSubs.map((s) =>
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
