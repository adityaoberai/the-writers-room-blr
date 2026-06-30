import { json } from '@sveltejs/kit';

/** Normalise thrown errors into a JSON response with a sensible status code. */
export function jsonError(err) {
	const status =
		err?.status || (err?.name === 'ValidationError' ? 400 : err?.code === 404 ? 404 : 500);
	const message =
		status === 500 ? 'Something went wrong. Please try again.' : err?.message || 'Request failed.';
	if (status === 500) console.error('[api]', err);
	return json({ error: message }, { status });
}

export async function readJson(request) {
	try {
		return (await request.json()) ?? {};
	} catch {
		return {};
	}
}
