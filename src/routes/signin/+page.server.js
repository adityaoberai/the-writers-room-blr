import { fail, redirect } from '@sveltejs/kit';
import { requestOtp, completeLogin } from '$lib/server/auth.js';

function safeRedirect(target) {
	// Only allow same-site, absolute-path redirects.
	if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) return '/';
	if (target === '/signin' || target.startsWith('/signin?')) return '/';
	if (target === '/api' || target.startsWith('/api/')) return '/';
	return target;
}

export function load({ locals, url }) {
	const redirectTo = url.searchParams.get('redirect') || '';
	if (locals.user) throw redirect(303, safeRedirect(redirectTo));
	return { redirectTo };
}

export const actions = {
	request: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email') || '').trim();
		const redirectTo = String(form.get('redirect') || '');
		try {
			const { challenge_id, expires_in } = await requestOtp(email);
			return { step: 'verify', email, challenge_id, expires_in, redirectTo };
		} catch (err) {
			return fail(400, {
				step: 'email',
				email,
				redirectTo,
				error: err.message || 'Could not send code.'
			});
		}
	},

	verify: async ({ request, cookies }) => {
		const form = await request.formData();
		const challenge_id = String(form.get('challenge_id') || '');
		const otp = String(form.get('otp') || '').trim();
		const email = String(form.get('email') || '');
		const redirectTo = String(form.get('redirect') || '');
		try {
			await completeLogin(cookies, { challengeId: challenge_id, otp });
			throw redirect(303, '/');
		} catch (err) {
			if (err?.status === 303) throw err; // re-throw the redirect
			return fail(400, {
				step: 'verify',
				email,
				challenge_id,
				redirectTo,
				error: err.message || 'Invalid code.'
			});
		}
	}
};
