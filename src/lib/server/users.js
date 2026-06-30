/**
 * The application `users` table mirrors a subset of each Appwrite Auth account
 * and carries the community role/status. Admin authority is derived from the
 * Auth user's `labels` (the native Appwrite mechanism); `ADMIN_EMAILS` is only a
 * bootstrap that promotes listed accounts and stamps the `admin` label on them.
 */
import { env } from '$env/dynamic/private';
import { adminUsers } from './appwrite.js';
import { createRow, tryGetRow, updateRow } from './data.js';
import { TABLES } from '$lib/constants.js';

const ADMIN_EMAILS = (env.ADMIN_EMAILS || '')
	.split(',')
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean);

export function emailIsBootstrapAdmin(email) {
	return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/** True when the Auth account carries the `admin` label or is a bootstrap admin. */
export function authUserIsAdmin(authUser) {
	const labels = authUser?.labels ?? [];
	return labels.includes('admin') || emailIsBootstrapAdmin(authUser?.email);
}

/**
 * Called on every successful login. Ensures the bootstrap `admin` label is set
 * in Auth, then upserts the application `users` row with the resolved role,
 * active status and last-login timestamp.
 */
export async function syncUserOnLogin(authUser) {
	const isAdmin = authUserIsAdmin(authUser);

	// Persist admin status into Appwrite Auth itself for bootstrap accounts.
	if (emailIsBootstrapAdmin(authUser.email) && !(authUser.labels ?? []).includes('admin')) {
		try {
			await adminUsers().updateLabels({
				userId: authUser.$id,
				labels: [...new Set([...(authUser.labels ?? []), 'admin'])]
			});
		} catch {
			// Non-fatal: fall back to email-based admin resolution.
		}
	}

	const role = isAdmin ? 'admin' : 'member';
	const now = new Date().toISOString();
	const existing = await tryGetRow(TABLES.users, authUser.$id);

	if (!existing) {
		const created = await createRow(TABLES.users, authUser.$id, {
			email: authUser.email,
			role,
			status: 'active',
			last_login_at: now
		});
		return { user: created, isAdmin, isNew: true };
	}

	// Never silently downgrade an admin set in the Console; otherwise keep in sync.
	const nextRole = existing.role === 'admin' || isAdmin ? 'admin' : 'member';
	const updated = await updateRow(TABLES.users, authUser.$id, {
		email: authUser.email,
		role: nextRole,
		last_login_at: now
	});
	return { user: updated, isAdmin: nextRole === 'admin', isNew: false };
}

export async function getAppUser(userId) {
	return tryGetRow(TABLES.users, userId);
}
