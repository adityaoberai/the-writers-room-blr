/**
 * Progression seals: badge milestones computed from a member's submissions,
 * and the summaries shown on the rewards page and public profiles.
 *
 * Duplicate protection is a unique index on (user_id, badge_id) plus an
 * existence check before insert; a 409 from the index is treated as
 * "already earned". Earned seals are never revoked, even if the member
 * later drops back below a threshold (e.g. a piece is unfeatured).
 */
import { createRow, listAllRows, Query } from './data.js';
import { ID } from './appwrite.js';
import { TABLES, BADGE_CRITERIA } from '$lib/constants.js';
import { listSubmissionsByUser } from './submissions.js';

/**
 * Seal inputs derived from a member's submissions: visible (non-rejected)
 * count, featured count, distinct content types and distinct calendar months
 * (both over visible pieces only, so rejected work never counts toward seals).
 */
function submissionMetrics(rows) {
	const visible = rows.filter((r) => r.status !== 'rejected');
	return {
		submissions: visible.length,
		featured: rows.filter((r) => r.status === 'featured').length,
		content_types: new Set(visible.map((r) => r.content_type).filter(Boolean)).size,
		active_months: new Set(visible.map((r) => (r.$createdAt ?? '').slice(0, 7)).filter(Boolean))
			.size
	};
}

/** Re-evaluate seal milestones for a user and grant any newly earned ones. */
export async function recomputeBadges(userId) {
	const [badges, earned, submissionRows] = await Promise.all([
		listAllRows(TABLES.badges, [Query.equal('is_active', true)]),
		listAllRows(TABLES.userBadges, [Query.equal('user_id', userId)]),
		listSubmissionsByUser(userId)
	]);

	const sub = submissionMetrics(submissionRows);
	const earnedIds = new Set(earned.map((b) => b.badge_id));
	const meets = (badge) =>
		BADGE_CRITERIA.includes(badge.criteria_type) &&
		sub[badge.criteria_type] >= badge.criteria_value;

	const newlyEarned = [];
	for (const badge of badges) {
		if (earnedIds.has(badge.$id)) continue;
		if (!meets(badge)) continue;
		try {
			await createRow(TABLES.userBadges, ID.unique(), {
				user_id: userId,
				badge_id: badge.$id,
				earned_at: new Date().toISOString()
			});
			newlyEarned.push(badge);
		} catch (err) {
			if (err?.code !== 409) throw err;
		}
	}
	return newlyEarned;
}

/** Earned badge definitions for a user (for public profiles). */
export async function getEarnedBadges(userId) {
	const earned = await listAllRows(TABLES.userBadges, [Query.equal('user_id', userId)]);
	if (!earned.length) return [];
	const ids = earned.map((b) => b.badge_id);
	const defs = await listAllRows(TABLES.badges, [Query.equal('$id', ids)]);
	const earnedAt = new Map(earned.map((b) => [b.badge_id, b.earned_at]));
	return defs
		.map((b) => ({
			id: b.$id,
			name: b.name,
			description: b.description ?? '',
			icon: b.icon ?? 'star',
			earned: true,
			earned_at: earnedAt.get(b.$id) ?? null
		}))
		.sort((a, b) => (a.earned_at < b.earned_at ? 1 : -1));
}

/** Map of user_id -> earned badge count, one query for a whole listing. */
export async function getBadgeCountsForUsers(userIds) {
	const unique = [...new Set(userIds.filter(Boolean))];
	if (!unique.length) return {};
	const rows = await listAllRows(TABLES.userBadges, [Query.equal('user_id', unique)]);
	const counts = {};
	for (const r of rows) counts[r.user_id] = (counts[r.user_id] ?? 0) + 1;
	return counts;
}

/** Rich seals summary: every active seal with progress, plus the earned set. */
export async function getRewardsSummary(userId) {
	const [allBadges, earned, submissionRows] = await Promise.all([
		listAllRows(TABLES.badges, [Query.equal('is_active', true)]),
		listAllRows(TABLES.userBadges, [Query.equal('user_id', userId)]),
		listSubmissionsByUser(userId)
	]);

	const sub = submissionMetrics(submissionRows);
	const earnedMap = new Map(earned.map((b) => [b.badge_id, b]));

	// Legacy badge definitions (e.g. points milestones) may linger; hide them.
	const visibleBadges = allBadges.filter((b) => BADGE_CRITERIA.includes(b.criteria_type));
	const badges = visibleBadges.map((b) => {
		const earnedRow = earnedMap.get(b.$id);
		const current = sub[b.criteria_type] ?? 0;
		const target = b.criteria_value;
		return {
			id: b.$id,
			name: b.name,
			description: b.description ?? '',
			icon: b.icon ?? 'star',
			criteria_type: b.criteria_type,
			criteria_value: b.criteria_value,
			earned: !!earnedRow,
			earned_at: earnedRow?.earned_at ?? null,
			progress: Math.max(0, Math.min(1, target ? current / target : 0)),
			current,
			target
		};
	});

	return {
		badges,
		earned_badges: badges.filter((b) => b.earned),
		metrics: sub
	};
}
