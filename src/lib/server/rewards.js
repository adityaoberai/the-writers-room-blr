/**
 * Activity-based rewards: point awards (with duplicate protection), badge
 * milestones, and the summary shown on the rewards page and profiles.
 *
 * Duplicate protection is enforced two ways: a unique index on
 * (user_id, source_type, source_id) for activity logs and (user_id, badge_id)
 * for badges, plus an existence check before insert. A 409 from the index is
 * treated as "already awarded".
 */
import { createRow, listAllRows, updateRow, Query } from './data.js';
import { ID } from './appwrite.js';
import { TABLES, REWARD_ACTION_LABELS, REWARD_ACTIONS } from '$lib/constants.js';
import { countVisibleSubmissionsByUser } from './submissions.js';
import { getProfileByUserId, isProfileComplete } from './profiles.js';

export async function getRewardRules() {
	const rows = await listAllRows(TABLES.rewardsRules);
	return rows.sort((a, b) => a.action_key.localeCompare(b.action_key));
}

/** Create or update the reward rule for an action (one rule per action_key). */
export async function upsertRewardRule({ action_key, points, is_active }) {
	if (!REWARD_ACTIONS.includes(action_key)) {
		throw Object.assign(new Error('Unknown reward action.'), { status: 400 });
	}
	const pts = Math.max(0, Math.round(Number(points) || 0));
	const active = is_active === undefined ? true : !!is_active;
	const id = `rule_${action_key}`;
	const data = { action_key, points: pts, is_active: active };
	try {
		return await updateRow(TABLES.rewardsRules, id, { points: pts, is_active: active });
	} catch (err) {
		if (err?.code === 404) return createRow(TABLES.rewardsRules, id, data);
		throw err;
	}
}

async function getActiveRule(actionKey) {
	const rows = await listAllRows(TABLES.rewardsRules, [Query.equal('action_key', actionKey)]);
	const rule = rows[0];
	return rule && rule.is_active ? rule : null;
}

export async function getActivityLogs(userId, limit = 50) {
	return listAllRows(TABLES.activityLogs, [
		Query.equal('user_id', userId),
		Query.orderDesc('$createdAt'),
		Query.limit(limit)
	]);
}

export async function getTotalPoints(userId) {
	const logs = await getActivityLogs(userId, 1000);
	return logs.reduce((sum, l) => sum + (l.points_awarded ?? 0), 0);
}

/**
 * Award points for an action, idempotent per (user, source_type, source_id).
 * Returns the points granted (0 if the rule is inactive or already awarded).
 */
export async function awardPoints({ userId, actionKey, sourceType, sourceId, notes = '' }) {
	const rule = await getActiveRule(actionKey);
	if (!rule || (rule.points ?? 0) <= 0) return { awarded: 0 };

	const existing = await listAllRows(TABLES.activityLogs, [
		Query.equal('user_id', userId),
		Query.equal('source_type', sourceType),
		Query.equal('source_id', sourceId),
		Query.limit(1)
	]);
	if (existing.length) return { awarded: 0, duplicate: true };

	try {
		await createRow(TABLES.activityLogs, ID.unique(), {
			user_id: userId,
			reward_rule_id: rule.$id,
			points_awarded: rule.points,
			source_type: sourceType,
			source_id: sourceId,
			notes
		});
	} catch (err) {
		if (err?.code === 409) return { awarded: 0, duplicate: true };
		throw err;
	}

	await recomputeBadges(userId);
	return { awarded: rule.points };
}

export async function awardProfileCompletion(userId, profile) {
	if (!profile?.$id || !isProfileComplete(profile)) return { awarded: 0 };
	return awardPoints({
		userId,
		actionKey: 'profile_completion',
		sourceType: 'profile',
		sourceId: profile.$id,
		notes: 'Completed profile'
	});
}

/** Re-evaluate badge milestones for a user and grant any newly earned badges. */
export async function recomputeBadges(userId) {
	const [badges, earned, logs, submissionCount, profile] = await Promise.all([
		listAllRows(TABLES.badges, [Query.equal('is_active', true)]),
		listAllRows(TABLES.userBadges, [Query.equal('user_id', userId)]),
		getActivityLogs(userId, 1000),
		countVisibleSubmissionsByUser(userId),
		getProfileByUserId(userId)
	]);

	const points = logs.reduce((s, l) => s + (l.points_awarded ?? 0), 0);
	const attendance = logs.filter((l) => l.source_type === 'event').length;
	const complete = isProfileComplete(profile);
	const earnedIds = new Set(earned.map((b) => b.badge_id));

	const meets = (badge) => {
		switch (badge.criteria_type) {
			case 'points':
				return points >= badge.criteria_value;
			case 'submissions':
				return submissionCount >= badge.criteria_value;
			case 'attendance':
				return attendance >= badge.criteria_value;
			case 'profile_completion':
				return complete;
			default:
				return false;
		}
	};

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

export async function getPublicRewards(userId) {
	const [total_points, badges] = await Promise.all([
		getTotalPoints(userId),
		getEarnedBadges(userId)
	]);
	return { total_points, badges };
}

/** Rich rewards summary: totals, earned + all badges (for progress), and history. */
export async function getRewardsSummary(userId) {
	const [allBadges, earned, logs, submissionCount, profile, rules] = await Promise.all([
		listAllRows(TABLES.badges, [Query.equal('is_active', true)]),
		listAllRows(TABLES.userBadges, [Query.equal('user_id', userId)]),
		getActivityLogs(userId, 100),
		countVisibleSubmissionsByUser(userId),
		getProfileByUserId(userId),
		getRewardRules()
	]);

	const total_points = logs.reduce((s, l) => s + (l.points_awarded ?? 0), 0);
	const attendance = logs.filter((l) => l.source_type === 'event').length;
	const complete = isProfileComplete(profile);
	const earnedMap = new Map(earned.map((b) => [b.badge_id, b]));
	const ruleLabel = new Map(
		rules.map((r) => [r.$id, REWARD_ACTION_LABELS[r.action_key] ?? r.action_key])
	);

	const progressFor = (badge) => {
		switch (badge.criteria_type) {
			case 'points':
				return { current: total_points, target: badge.criteria_value };
			case 'submissions':
				return { current: submissionCount, target: badge.criteria_value };
			case 'attendance':
				return { current: attendance, target: badge.criteria_value };
			case 'profile_completion':
				return { current: complete ? 1 : 0, target: 1 };
			default:
				return { current: 0, target: badge.criteria_value };
		}
	};

	const badges = allBadges.map((b) => {
		const earnedRow = earnedMap.get(b.$id);
		const { current, target } = progressFor(b);
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

	const activity_logs = logs.map((l) => ({
		id: l.$id,
		points_awarded: l.points_awarded ?? 0,
		source_type: l.source_type,
		label: ruleLabel.get(l.reward_rule_id) ?? l.source_type,
		notes: l.notes ?? '',
		created_at: l.$createdAt
	}));

	return {
		total_points,
		badges,
		earned_badges: badges.filter((b) => b.earned),
		activity_logs,
		metrics: { submissions: submissionCount, attendance, profile_complete: complete }
	};
}
