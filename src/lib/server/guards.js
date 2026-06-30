/**
 * Access-control guards for server routes and load functions. They read the
 * request locals populated by hooks.server.js and throw the appropriate HTTP
 * error when the caller is not permitted.
 */
import { error } from '@sveltejs/kit';

export function requireUser(locals) {
	if (!locals.user) throw error(401, 'You need to sign in to do that.');
	if (locals.appUser?.status === 'suspended') throw error(403, 'Your account is suspended.');
	return locals.user;
}

export function requireAdmin(locals) {
	requireUser(locals);
	if (!locals.isAdmin) throw error(403, 'Admins only.');
	return locals.user;
}
