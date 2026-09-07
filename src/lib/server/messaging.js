/**
 * Outbound email through Appwrite Messaging, delivered by the Resend provider.
 *
 *  - sendWelcomeEmail    one-off note when a member signs up for the first time
 *  - sendMemberEmail     admin dashboard: chosen members or every member
 *  - listRecentMessages  delivery history, read straight from Messaging
 *
 * Every email is CC'd to the organiser's inbox. The reply-to address lives on
 * the provider itself (see scripts/provision.mjs), so a plain reply also lands
 * there. Appwrite addresses CC by *target* id rather than by raw address, so
 * the CC inbox is an Auth user whose email target is looked up once per
 * process (and created on first use if it does not exist yet).
 */
import { env } from '$env/dynamic/private';
import { adminMessaging, adminUsers, ID, Query } from './appwrite.js';
import { listAllRows } from './data.js';
import { getAllSettings } from './settings.js';
import { displayNameOf } from './profiles.js';
import { escapeHtml, requireString, ValidationError } from './validation.js';
import {
	MESSAGING,
	TABLES,
	WELCOME_EMAIL_DEFAULTS,
	WELCOME_EMAIL_SETTING_KEYS
} from '$lib/constants.js';
import { SITE, siteUrl } from '$lib/seo.js';

export const CC_EMAIL = (env.MESSAGING_CC || MESSAGING.cc).trim().toLowerCase();
export const REPLY_TO_EMAIL = (env.MESSAGING_REPLY_TO || MESSAGING.replyTo).trim().toLowerCase();

const SUBJECT_MAX = 200;
const BODY_MAX = 10000;

/* ---------- CC inbox target ---------- */

let ccTargetsPromise = null;

/** Email target ids for the CC inbox. Cached per process; retried after a failure. */
export function getCcTargetIds() {
	if (!ccTargetsPromise) {
		ccTargetsPromise = resolveCcTargets().catch((err) => {
			ccTargetsPromise = null;
			console.error('[messaging] could not resolve the CC inbox target:', err?.message || err);
			return [];
		});
	}
	return ccTargetsPromise;
}

async function resolveCcTargets() {
	if (!CC_EMAIL) return [];
	const users = adminUsers();
	const found = await users.list({ queries: [Query.equal('email', CC_EMAIL), Query.limit(1)] });
	let inbox = found.users?.[0];
	if (!inbox) {
		// Appwrite creates the email target together with the account.
		inbox = await users.create({ userId: ID.unique(), email: CC_EMAIL, name: 'Community inbox' });
	}

	const emailTargets = (targets) =>
		(targets ?? []).filter((t) => t.providerType === 'email' && !t.expired).map((t) => t.$id);

	let ids = emailTargets(inbox.targets);
	if (!ids.length) {
		const listed = await users.listTargets({ userId: inbox.$id });
		ids = emailTargets(listed.targets);
	}
	if (!ids.length) {
		const target = await users.createTarget({
			userId: inbox.$id,
			targetId: ID.unique(),
			providerType: 'email',
			identifier: CC_EMAIL
		});
		ids = [target.$id];
	}
	return ids;
}

/* ---------- Rendering ---------- */

const URL_RE = /https?:\/\/[^\s<]+[^\s<.,;:!?)'"]/g;

/**
 * Plain text to a small, self-contained HTML email: blank lines separate
 * paragraphs, single newlines become line breaks, bare URLs become links.
 * The text is escaped before anything else, so no member/admin input reaches
 * the HTML unencoded.
 */
export function renderEmailHtml(text) {
	const paragraphs = String(text ?? '')
		.replace(/\r\n?/g, '\n')
		.trim()
		.split(/\n{2,}/)
		.map((p) => {
			const safe = escapeHtml(p).replace(
				URL_RE,
				(url) => `<a href="${url}" style="color:#8a4b1c;">${url}</a>`
			);
			return `<p style="margin:0 0 1em;">${safe.replace(/\n/g, '<br>')}</p>`;
		})
		.join('');
	const origin = siteUrl();
	const host = origin.replace(/^https?:\/\//, '');

	return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4efe6;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4efe6;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fffdf8;border:1px solid #e3d9c6;">
<tr><td style="padding:28px 32px 12px;border-bottom:2px solid #1b1812;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#1b1812;">
${escapeHtml(SITE.name)}
</td></tr>
<tr><td style="padding:28px 32px 8px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#1b1812;">
${paragraphs}
</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid #e3d9c6;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:#6b6257;">
You are receiving this because you signed up at <a href="${escapeHtml(origin)}" style="color:#8a4b1c;">${escapeHtml(host)}</a>. Reply to this email to reach us.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/* ---------- Sending ---------- */

/** Rewrap provider/config failures into something an admin can act on. */
function sendError(err) {
	const msg = String(err?.message || err || '');
	const hint = /provider/i.test(msg)
		? ' No email provider is configured: run scripts/provision.mjs with RESEND_API_KEY set.'
		: '';
	return Object.assign(new Error(`Email could not be sent. ${msg}${hint}`.trim()), { status: 502 });
}

async function sendEmail({ subject, text, userIds = [] }) {
	const cc = await getCcTargetIds();
	const params = {
		messageId: ID.unique(),
		subject,
		content: renderEmailHtml(text),
		users: userIds,
		html: true
	};
	if (cc.length) params.cc = cc;
	try {
		return await adminMessaging().createEmail(params);
	} catch (err) {
		throw sendError(err);
	}
}

/* ---------- Welcome email ---------- */

/** Admin-editable welcome copy, falling back to the defaults when a setting is blank. */
export async function getWelcomeEmailCopy(settings) {
	const s = settings ?? (await getAllSettings());
	return {
		subject: (s[WELCOME_EMAIL_SETTING_KEYS.subject] ?? '').trim() || WELCOME_EMAIL_DEFAULTS.subject,
		body: (s[WELCOME_EMAIL_SETTING_KEYS.body] ?? '').trim() || WELCOME_EMAIL_DEFAULTS.body
	};
}

export function validateWelcomeEmailCopy(input) {
	return {
		subject: requireString(input.subject, 'Subject', { max: SUBJECT_MAX }),
		body: requireString(input.body, 'Message', { max: BODY_MAX })
	};
}

/**
 * Send the welcome note to a member who has just registered. Never throws: a
 * failed welcome email must not block sign-in.
 */
export async function sendWelcomeEmail(authUser) {
	try {
		const { subject, body } = await getWelcomeEmailCopy();
		const message = await sendEmail({ subject, text: body, userIds: [authUser.$id] });
		return message.$id;
	} catch (err) {
		console.error(`[messaging] welcome email failed for ${authUser?.$id}:`, err?.message || err);
		return null;
	}
}

/* ---------- Admin messaging ---------- */

/** Every member as an addressable recipient, named from their profile when they have one. */
export async function listRecipients() {
	const [users, profiles] = await Promise.all([
		listAllRows(TABLES.users),
		listAllRows(TABLES.profiles)
	]);
	const nameByUser = new Map(profiles.map((p) => [p.user_id, displayNameOf(p)]));
	return users
		.map((u) => ({
			user_id: u.$id,
			email: u.email ?? '',
			display_name: nameByUser.get(u.$id) || '',
			status: u.status ?? 'active',
			role: u.role ?? 'member'
		}))
		.sort((a, b) =>
			(a.display_name || a.email).localeCompare(b.display_name || b.email, undefined, {
				sensitivity: 'base'
			})
		);
}

/** Resolve the requested ids against the members table so only real members are addressed. */
async function resolveMemberIds(userIds) {
	const wanted = [...new Set((userIds ?? []).map((id) => String(id ?? '').trim()).filter(Boolean))];
	if (!wanted.length) throw new ValidationError('Pick at least one member.');
	const found = [];
	for (let i = 0; i < wanted.length; i += 100) {
		const rows = await listAllRows(TABLES.users, [Query.equal('$id', wanted.slice(i, i + 100))]);
		found.push(...rows.map((u) => u.$id));
	}
	if (!found.length) throw new ValidationError('None of the selected members were found.');
	return found;
}

/**
 * Send one email to chosen members (`audience: 'selected'` + `userIds`) or to
 * every non-suspended member (`audience: 'all'`). Returns the Messaging id and
 * the recipient count.
 */
export async function sendMemberEmail({ subject, body, audience = 'selected', userIds = [] }) {
	const cleanSubject = requireString(subject, 'Subject', { max: SUBJECT_MAX });
	const text = requireString(body, 'Message', { max: BODY_MAX });

	let recipients;
	if (audience === 'all') {
		const users = await listAllRows(TABLES.users, [Query.notEqual('status', 'suspended')]);
		recipients = users.map((u) => u.$id);
		if (!recipients.length) throw new ValidationError('There are no members to email yet.');
	} else if (audience === 'selected') {
		recipients = await resolveMemberIds(userIds);
	} else {
		throw new ValidationError('Invalid audience.');
	}

	const message = await sendEmail({ subject: cleanSubject, text, userIds: recipients });
	return { message_id: message.$id, status: message.status, recipients: recipients.length };
}

function serializeMessage(m) {
	return {
		id: m.$id,
		subject: m.data?.subject ?? '(no subject)',
		status: m.status,
		recipients: (m.users?.length ?? 0) + (m.targets?.length ?? 0),
		delivered_total: m.deliveredTotal ?? 0,
		delivery_errors: m.deliveryErrors ?? [],
		created_at: m.$createdAt,
		delivered_at: m.deliveredAt ?? '',
		scheduled_at: m.scheduledAt ?? ''
	};
}

/** Most recent emails, newest first. Returns [] when Messaging is unreachable. */
export async function listRecentMessages(limit = 25) {
	try {
		const res = await adminMessaging().listMessages({
			queries: [
				Query.equal('providerType', 'email'),
				Query.orderDesc('$createdAt'),
				Query.limit(limit)
			]
		});
		return (res.messages ?? []).map(serializeMessage);
	} catch (err) {
		console.error('[messaging] listMessages failed:', err?.message || err);
		return [];
	}
}
