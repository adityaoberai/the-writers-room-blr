/**
 * Writing submissions: creation, public listings, moderation and the counts the
 * admin dashboard and directory-visibility rule depend on.
 */
import { createRow, getRow, listAllRows, listRows, updateRow, countRows, Query } from './data.js';
import { TABLES, CONTENT_TYPES, SUBMISSION_STATUSES, CONTENT_TYPE_LABELS } from '$lib/constants.js';
import {
	requireString,
	cleanString,
	cleanTagList,
	optionalUrl,
	ensureOneOf,
	renderBodyToHtml
} from './validation.js';
import { DEFAULT_SUBMISSION_IMAGE } from './link-preview.js';

const PUBLIC_STATUSES = ['approved', 'featured'];

/** Build the public-facing view of a submission. */
export function serializeSubmission(row, { author = null, includeBody = false } = {}) {
	return {
		id: row.$id,
		title: row.title,
		summary: row.summary ?? '',
		content_type: row.content_type,
		content_type_label: CONTENT_TYPE_LABELS[row.content_type] ?? row.content_type,
		external_url: row.external_url ?? '',
		preview_image: DEFAULT_SUBMISSION_IMAGE,
		status: row.status,
		tags: row.tags ?? [],
		author,
		user_id: row.user_id,
		created_at: row.$createdAt,
		...(includeBody ? { body_html: renderBodyToHtml(row.body), body: row.body ?? '' } : {})
	};
}

export async function createSubmission(userId, input) {
	const title = requireString(input.title, 'Title', { max: 256 });
	const summary = cleanString(input.summary, { max: 1024 });
	const contentType = ensureOneOf(
		requireString(input.content_type, 'Type', { max: 32 }),
		CONTENT_TYPES,
		'type'
	);
	const externalUrl = optionalUrl(input.external_url, 'External URL');
	const tags = cleanTagList(input.tags);

	const data = {
		user_id: userId,
		title,
		summary,
		content_type: contentType,
		status: 'approved',
		tags
	};
	// `external_url` is a URL column; omit it when blank (empty string is rejected).
	if (externalUrl) data.external_url = externalUrl;

	return createRow(TABLES.submissions, 'unique()', data);
}

export async function getSubmission(id) {
	return getRow(TABLES.submissions, id);
}

export async function listPublicSubmissions({ limit = 50 } = {}) {
	const { rows } = await listRows(TABLES.submissions, [
		Query.equal('status', PUBLIC_STATUSES),
		Query.orderDesc('$createdAt'),
		Query.limit(limit)
	]);
	return rows;
}

export async function listFeaturedSubmissions(limit = 3) {
	const { rows } = await listRows(TABLES.submissions, [
		Query.equal('status', 'featured'),
		Query.orderDesc('$updatedAt'),
		Query.limit(limit)
	]);
	return rows;
}

export async function listSubmissionsByUser(userId) {
	return listAllRows(TABLES.submissions, [
		Query.equal('user_id', userId),
		Query.orderDesc('$createdAt')
	]);
}

export async function listPublicSubmissionsByUser(userId) {
	const { rows } = await listRows(TABLES.submissions, [
		Query.equal('user_id', userId),
		Query.equal('status', PUBLIC_STATUSES),
		Query.orderDesc('$createdAt'),
		Query.limit(50)
	]);
	return rows;
}

/** Whether a member has at least one non-rejected submission (directory gate). */
export async function userHasVisibleSubmission(userId) {
	const count = await countRows(TABLES.submissions, [
		Query.equal('user_id', userId),
		Query.notEqual('status', 'rejected')
	]);
	return count > 0;
}

export async function countVisibleSubmissionsByUser(userId) {
	return countRows(TABLES.submissions, [
		Query.equal('user_id', userId),
		Query.notEqual('status', 'rejected')
	]);
}

export async function listPendingSubmissions(limit = 50) {
	const { rows } = await listRows(TABLES.submissions, [
		Query.equal('status', 'pending'),
		Query.orderAsc('$createdAt'),
		Query.limit(limit)
	]);
	return rows;
}

/** Every submission (any status), newest first — powers the admin list/unlist tab. */
export async function listRecentSubmissions(limit = 100) {
	const { rows } = await listRows(TABLES.submissions, [
		Query.orderDesc('$createdAt'),
		Query.limit(limit)
	]);
	return rows;
}

export async function moderateSubmission(id, { status, featured, adminId }) {
	let nextStatus = status;
	if (featured === true) nextStatus = 'featured';
	if (featured === false && (status === 'featured' || status === undefined))
		nextStatus = 'approved';
	if (nextStatus) ensureOneOf(nextStatus, SUBMISSION_STATUSES, 'status');

	const data = { moderated_by: adminId, moderated_at: new Date().toISOString() };
	if (nextStatus) data.status = nextStatus;
	// `note` is recorded by the caller in the activity log, not on the submission.
	return updateRow(TABLES.submissions, id, data);
}

export async function submissionCounts() {
	const entries = await Promise.all(
		['total', ...SUBMISSION_STATUSES].map(async (key) => {
			if (key === 'total') return ['total', await countRows(TABLES.submissions)];
			return [key, await countRows(TABLES.submissions, [Query.equal('status', key)])];
		})
	);
	return Object.fromEntries(entries);
}
