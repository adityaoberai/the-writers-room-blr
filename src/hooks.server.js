/**
 * Request lifecycle: resolve the Appwrite session into `locals`, guard
 * authenticated and admin-only page routes, and attach security headers to
 * every response.
 */
import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/appwrite.js';
import { resolveSession } from '$lib/server/auth.js';
import { authUserIsAdmin, getAppUser } from '$lib/server/users.js';

const MEMBER_PREFIXES = ['/onboarding', '/me', '/submit', '/rewards', '/account'];
const ADMIN_PREFIX = '/admin';

async function loadSession(event) {
	const secret = event.cookies.get(SESSION_COOKIE);
	if (!secret) return;

	const authUser = await resolveSession(secret, event.request.headers.get('user-agent'));
	if (!authUser) {
		// Stale/invalid session; clear it so we don't revalidate every request.
		event.cookies.delete(SESSION_COOKIE, { path: '/' });
		return;
	}

	const appUser = await getAppUser(authUser.$id).catch(() => null);
	event.locals.user = authUser;
	event.locals.appUser = appUser;
	event.locals.isAdmin = authUserIsAdmin(authUser) || appUser?.role === 'admin';
}

function guard(event) {
	const { pathname } = event.url;
	if (pathname.startsWith('/api')) return; // API routes enforce auth in their handlers

	const needsAdmin = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
	const needsMember = MEMBER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

	if ((needsAdmin || needsMember) && !event.locals.user) {
		throw redirect(303, `/signin?redirect=${encodeURIComponent(pathname)}`);
	}
	if (needsAdmin && !event.locals.isAdmin) {
		throw redirect(303, '/');
	}
}

export async function handle({ event, resolve }) {
	await loadSession(event);
	guard(event);

	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"base-uri 'self'",
			"form-action 'self'",
			"frame-ancestors 'none'",
			"img-src 'self' data: https:",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"script-src 'self' 'unsafe-inline'",
			"connect-src 'self' https://*.cloud.appwrite.io"
		].join('; ')
	);

	return response;
}
