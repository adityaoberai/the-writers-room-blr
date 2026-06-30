import { json } from '@sveltejs/kit';
import { requestOtp } from '$lib/server/auth.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// POST /api/auth/request-otp { email } -> { challenge_id, expires_in }
export async function POST({ request }) {
	try {
		const { email } = await readJson(request);
		return json(await requestOtp(email));
	} catch (err) {
		return jsonError(err);
	}
}
