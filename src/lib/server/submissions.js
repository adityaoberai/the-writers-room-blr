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
	ValidationError
} from './validation.js';
import { DEFAULT_SUBMISSION_IMAGE, resolveSubmissionPreviewImage } from './link-preview.js';
import { getProfileByUserId } from './profiles.js';

const PUBLIC_STATUSES = ['approved', 'featured'];

/**
 * The single full-text-indexed field the Writings search queries. Combining
 * title, summary, tags and the author's name into one column lets one
 * `Query.search` cover them all (Appwrite can't OR multiple fulltext searches).
 */
function buildSearchText({ title = '', summary = '', tags = [], authorName = '' }) {
	return [title, summary, ...(tags ?? []), authorName].filter(Boolean).join(' ').slice(0, 8000);
}

/** Build the public-facing view of a submission. */
export function serializeSubmission(row, { author = null } = {}) {
	return {
		id: row.$id,
		title: row.title,
		summary: row.summary ?? '',
		content_type: row.content_type,
		content_type_label: CONTENT_TYPE_LABELS[row.content_type] ?? row.content_type,
		external_url: row.external_url ?? '',
		// A creator-uploaded image is authoritative; otherwise the link-preview
		// pipeline may replace this default with a scraped OG image.
		preview_image: row.image_url || DEFAULT_SUBMISSION_IMAGE,
		status: row.status,
		tags: row.tags ?? [],
		author,
		user_id: row.user_id,
		created_at: row.$createdAt
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
	let imageUrl = cleanString(input.image_url, { max: 2048 });
	const tags = cleanTagList(input.tags);

	// No uploaded cover but there is a link: snapshot the link's OG image now so
	// reads don't have to scrape it. Only store a real hit (not the default) and
	// short enough to fit the column; otherwise read-time scraping stays the fallback.
	if (!imageUrl && externalUrl) {
		const og = await resolveSubmissionPreviewImage(externalUrl);
		if (og && og !== DEFAULT_SUBMISSION_IMAGE && og.length <= 2048) imageUrl = og;
	}

	const profile = await getProfileByUserId(userId);
	const data = {
		user_id: userId,
		title,
		summary,
		content_type: contentType,
		status: 'approved',
		tags,
		search_text: buildSearchText({ title, summary, tags, authorName: profile?.display_name ?? '' })
	};
	// `external_url` is a URL column; omit it when blank (empty string is rejected).
	if (externalUrl) data.external_url = externalUrl;
	if (imageUrl) data.image_url = imageUrl;

	try {
		return await createRow(TABLES.submissions, 'unique()', data);
	} catch (err) {
		// Unique index on title / external_url rejects duplicates with a 409.
		if (err?.code === 409) {
			throw new ValidationError('A piece with this title or link has already been shared.');
		}
		throw err;
	}
}

/**
 * Update a member's own submission. Owner-only (admins moderate via the dashboard).
 * Re-resolves the OG image only when the link changed and there's no stored image,
 * mirroring create. `external_url` is cleared to null when blank.
 */
export async function updateSubmission(id, userId, input) {
	const row = await getRow(TABLES.submissions, id);
	if (row.user_id !== userId) {
		throw Object.assign(new Error('You can only edit your own pieces.'), { status: 403 });
	}

	const title = requireString(input.title, 'Title', { max: 256 });
	const summary = cleanString(input.summary, { max: 1024 });
	const contentType = ensureOneOf(
		requireString(input.content_type, 'Type', { max: 32 }),
		CONTENT_TYPES,
		'type'
	);
	const externalUrl = optionalUrl(input.external_url, 'External URL');
	const imageUrl = cleanString(input.image_url, { max: 2048 });

	const profile = await getProfileByUserId(userId);
	const data = {
		title,
		summary,
		content_type: contentType,
		external_url: externalUrl || null,
		search_text: buildSearchText({
			title,
			summary,
			tags: row.tags ?? [],
			authorName: profile?.display_name ?? ''
		})
	};

	if (imageUrl) {
		data.image_url = imageUrl;
	} else if (externalUrl && externalUrl !== (row.external_url ?? '') && !row.image_url) {
		const og = await resolveSubmissionPreviewImage(externalUrl);
		if (og && og !== DEFAULT_SUBMISSION_IMAGE && og.length <= 2048) data.image_url = og;
	}

	try {
		return await updateRow(TABLES.submissions, id, data);
	} catch (err) {
		if (err?.code === 409) {
			throw new ValidationError('A piece with this title or link has already been shared.');
		}
		throw err;
	}
}

export async function getSubmission(id) {
	return getRow(TABLES.submissions, id);
}

export async function listPublicSubmissions({ limit = 50, externalOnly = false } = {}) {
	const queries = [
		Query.equal('status', PUBLIC_STATUSES),
		Query.orderDesc('$createdAt'),
		Query.limit(limit)
	];
	// The public Writings page only lists pieces that link out to the full text.
	if (externalOnly) queries.push(Query.isNotNull('external_url'));
	const { rows } = await listRows(TABLES.submissions, queries);
	return rows;
}

/** Base filter for public, externally-linked writing (the Writings page rule). */
const WRITING_BASE = () => [
	Query.equal('status', PUBLIC_STATUSES),
	Query.isNotNull('external_url')
];

const WRITING_SORT = {
	newest: () => Query.orderDesc('$createdAt'),
	oldest: () => Query.orderAsc('$createdAt'),
	title: () => Query.orderAsc('title')
};

/**
 * One server-side-filtered, cursor-paginated page of public writing. All
 * filtering (type/tag/author/search) and sorting run as TablesDB queries so they
 * apply across the whole table, not just a loaded slice. `total` is the full
 * match count; `nextCursor` is the last row id (empty when the page wasn't full).
 */
export async function listWritingPage({
	type = '',
	tag = '',
	authorId = '',
	search = '',
	sort = 'newest',
	cursor = '',
	limit = 24
} = {}) {
	const queries = WRITING_BASE();
	if (type) queries.push(Query.equal('content_type', type));
	if (authorId) queries.push(Query.equal('user_id', authorId));
	if (tag) queries.push(Query.contains('tags', [tag]));

	// Full-text search over the combined title/summary/tags/author field.
	const term = search.trim();
	if (term) queries.push(Query.search('search_text', term));

	queries.push((WRITING_SORT[sort] ?? WRITING_SORT.newest)());
	queries.push(Query.limit(limit));
	if (cursor) queries.push(Query.cursorAfter(cursor));

	const { rows, total } = await listRows(TABLES.submissions, queries);
	const nextCursor = rows.length === limit ? (rows[rows.length - 1]?.$id ?? '') : '';
	return { rows, total, nextCursor };
}

/**
 * Distinct facet values for the Writings filters. Selects only the fields needed
 * and scans the (small) public set once — enough to populate the dropdowns.
 */
export async function getWritingFacets() {
	const rows = await listAllRows(TABLES.submissions, [
		...WRITING_BASE(),
		Query.select(['content_type', 'tags', 'user_id'])
	]);
	const types = new Set();
	const tags = new Set();
	const userIds = new Set();
	for (const r of rows) {
		if (r.content_type) types.add(r.content_type);
		for (const t of r.tags ?? []) tags.add(t);
		if (r.user_id) userIds.add(r.user_id);
	}
	return {
		types: [...types],
		tags: [...tags].sort((a, b) => a.localeCompare(b)),
		userIds: [...userIds]
	};
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
