/**
 * Member feedback: rows are written by members through the /feedback form and
 * triaged from the admin dashboard.
 */
import { createRow, listAllRows, updateRow, countRows, Query } from './data.js';
import {
	TABLES,
	FEEDBACK_CATEGORIES,
	FEEDBACK_STATUSES,
	FEEDBACK_CATEGORY_LABELS
} from '$lib/constants.js';
import { requireString, cleanString, ensureOneOf } from './validation.js';

const MESSAGE_MAX = 5000;

/** Build the admin-facing view of a feedback row. */
export function serializeFeedback(row, { author = null } = {}) {
	return {
		id: row.$id,
		user_id: row.user_id,
		email: row.email ?? '',
		category: row.category,
		category_label: FEEDBACK_CATEGORY_LABELS[row.category] ?? row.category,
		message: row.message,
		page: row.page ?? '',
		attachment_url: row.attachment_url ?? '',
		status: row.status ?? 'new',
		author,
		created_at: row.$createdAt
	};
}

export async function createFeedback(userId, email, input) {
	const category = ensureOneOf(
		requireString(input.category, 'Category', { max: 32 }),
		FEEDBACK_CATEGORIES,
		'category'
	);
	const message = requireString(input.message, 'Message', { max: MESSAGE_MAX });
	const page = cleanString(input.page, { max: 256 });
	const attachmentUrl = cleanString(input.attachment_url, { max: 2048 });

	const data = {
		user_id: userId,
		email: cleanString(email, { max: 320 }),
		category,
		message,
		status: 'new'
	};
	if (page) data.page = page;
	if (attachmentUrl) data.attachment_url = attachmentUrl;

	return createRow(TABLES.feedback, 'unique()', data);
}

/** Every feedback row, newest first; powers the admin Feedback tab. */
export async function listAllFeedback() {
	return listAllRows(TABLES.feedback, [Query.orderDesc('$createdAt')]);
}

export async function setFeedbackStatus(id, { status, adminId }) {
	ensureOneOf(status, FEEDBACK_STATUSES, 'status');
	return updateRow(TABLES.feedback, id, {
		status,
		reviewed_by: adminId,
		reviewed_at: new Date().toISOString()
	});
}

export async function countNewFeedback() {
	return countRows(TABLES.feedback, [Query.equal('status', 'new')]);
}
