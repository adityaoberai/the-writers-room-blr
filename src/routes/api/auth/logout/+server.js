import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/appwrite.js';
import { logout, clearSessionCookie } from '$lib/server/auth.js';

// POST /api/auth/logout -> clears the session and returns home.
export async function POST({ cookies }) {
	const secret = cookies.get(SESSION_COOKIE);
	await logout(secret);
	clearSessionCookie(cookies);
	throw redirect(303, '/');
}
