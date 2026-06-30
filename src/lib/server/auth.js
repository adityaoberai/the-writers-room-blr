/**
 * Email-OTP authentication flow built on Appwrite Auth tokens.
 *
 *  1. requestOtp  -> creates an email token; Appwrite emails the 6-digit code.
 *  2. verifyOtp   -> exchanges (userId, code) for a session, then mirrors the
 *                    Auth account into the application `users` table.
 *  3. resolveSession / logout -> validate or tear down a session.
 *
 * Route handlers own the httpOnly session cookie; this module only talks to
 * Appwrite and returns plain data.
 */
import { dev } from '$app/environment';
import { adminAccount, adminUsers, sessionAccount, SESSION_COOKIE, ID } from './appwrite.js';
import { syncUserOnLogin } from './users.js';
import { isValidEmail, ValidationError } from './validation.js';

/** Persist the Appwrite session secret in a secure, httpOnly cookie. */
export function setSessionCookie(cookies, session) {
	cookies.set(SESSION_COOKIE, session.secret, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires: session.expire ? new Date(session.expire) : undefined
	});
}

export function clearSessionCookie(cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

function secondsUntil(iso) {
	const ms = Date.parse(iso);
	if (Number.isNaN(ms)) return 900;
	return Math.max(0, Math.floor((ms - Date.now()) / 1000));
}

/** Send a one-time passcode to `email`. Returns a challenge id (the Auth user id). */
export async function requestOtp(email) {
	const normalized = String(email || '')
		.trim()
		.toLowerCase();
	if (!isValidEmail(normalized)) throw new ValidationError('Enter a valid email address.');

	const token = await adminAccount().createEmailToken({
		userId: ID.unique(),
		email: normalized
	});
	return {
		challenge_id: token.userId,
		expires_in: token.expire ? secondsUntil(token.expire) : 900
	};
}

/**
 * Verify a passcode and create a session. Returns the session (with secret &
 * expiry for the cookie), the resolved application user and admin flag.
 */
export async function verifyOtp({ challengeId, otp }) {
	const userId = String(challengeId || '').trim();
	const secret = String(otp || '').trim();
	if (!userId) throw new ValidationError('Missing challenge id. Request a new code.');
	if (!/^\d{4,10}$/.test(secret)) throw new ValidationError('Enter the code from your email.');

	let session;
	try {
		session = await adminAccount().createSession({ userId, secret });
	} catch (err) {
		if (err?.code === 401) throw new ValidationError('That code is invalid or has expired.');
		throw err;
	}

	const authUser = await adminUsers().get({ userId: session.userId });
	const { user, isAdmin } = await syncUserOnLogin(authUser);

	return { session, authUser, appUser: user, isAdmin };
}

/**
 * End-to-end login step used by both the sign-in form action and the
 * /api/auth/verify-otp endpoint: verify the code, set the cookie and make sure
 * the member has a profile row.
 */
export async function completeLogin(cookies, { challengeId, otp }) {
	const { session, authUser, appUser, isAdmin } = await verifyOtp({ challengeId, otp });
	setSessionCookie(cookies, session);

	const { ensureProfile, isProfileComplete } = await import('./profiles.js');
	const displayName = authUser.name || authUser.email?.split('@')[0] || 'New member';
	const profile = await ensureProfile(authUser.$id, displayName);

	return {
		user_id: authUser.$id,
		role: appUser?.role ?? (isAdmin ? 'admin' : 'member'),
		isAdmin,
		isNew: !isProfileComplete(profile),
		profileComplete: isProfileComplete(profile),
		session: { id: session.$id, expire: session.expire }
	};
}

/** Validate a session secret and return the Auth account, or null when invalid. */
export async function resolveSession(secret, userAgent) {
	if (!secret) return null;
	try {
		return await sessionAccount(secret, userAgent).get();
	} catch {
		return null;
	}
}

/** Best-effort revocation of the current session held by `secret`. */
export async function logout(secret) {
	if (!secret) return;
	try {
		await sessionAccount(secret).deleteSession({ sessionId: 'current' });
	} catch {
		// Session may already be gone; clearing the cookie is enough.
	}
}
