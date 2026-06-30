import { env } from '$env/dynamic/public';

export const SITE = {
	name: "The Writers' Room BLR",
	short: "Writers' Room BLR",
	tagline:
		'A focused writing community for Bengaluru writers to create, connect, and grow together.',
	locale: 'en_IN'
};

/** Absolute site origin, used for canonical links and absolute OG URLs. */
export function siteUrl() {
	return (env.PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
}

export function absoluteUrl(path = '/') {
	if (/^https?:\/\//.test(path)) return path;
	return siteUrl() + (path.startsWith('/') ? path : `/${path}`);
}
