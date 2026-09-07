import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/guards.js';
import { jsonError, readJson } from '$lib/server/respond.js';
import {
	listRecentMessages,
	listRecipients,
	sendMemberEmail,
	CC_EMAIL,
	REPLY_TO_EMAIL
} from '$lib/server/messaging.js';

// GET /api/admin/messages -> { messages, recipients, cc, reply_to }
export async function GET({ locals }) {
	try {
		requireAdmin(locals);
		const [messages, recipients] = await Promise.all([listRecentMessages(), listRecipients()]);
		return json({ messages, recipients, cc: CC_EMAIL, reply_to: REPLY_TO_EMAIL });
	} catch (err) {
		return jsonError(err);
	}
}

// POST /api/admin/messages { subject, body, audience: 'selected'|'all', user_ids } -> { message_id, status, recipients }
export async function POST({ request, locals }) {
	try {
		requireAdmin(locals);
		const input = await readJson(request);
		const result = await sendMemberEmail({
			subject: input.subject,
			body: input.body,
			audience: input.audience ?? 'selected',
			userIds: Array.isArray(input.user_ids) ? input.user_ids : []
		});
		return json(result, { status: 202 });
	} catch (err) {
		return jsonError(err);
	}
}
