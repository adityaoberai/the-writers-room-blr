import { json } from '@sveltejs/kit';
import { completeLogin } from '$lib/server/auth.js';
import { jsonError, readJson } from '$lib/server/respond.js';

// POST /api/auth/verify-otp { email, otp, challenge_id } -> { user_id, role, session }
export async function POST({ request, cookies }) {
	try {
		const body = await readJson(request);
		const result = await completeLogin(cookies, {
			challengeId: body.challenge_id,
			otp: body.otp
		});
		return json({ user_id: result.user_id, role: result.role, session: result.session });
	} catch (err) {
		return jsonError(err);
	}
}
