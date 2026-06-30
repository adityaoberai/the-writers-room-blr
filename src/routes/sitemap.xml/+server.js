import { siteUrl } from '$lib/seo.js';
import { listDirectory } from '$lib/server/profiles.js';
import { listPublicSubmissions } from '$lib/server/submissions.js';

export const prerender = false;

const STATIC_ROUTES = ['/', '/directory', '/writing', '/events', '/signin'];

function urlTag(loc, lastmod, priority) {
	return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${
		priority ? `<priority>${priority}</priority>` : ''
	}</url>`;
}

export async function GET() {
	const base = siteUrl();
	const [{ members }, submissions] = await Promise.all([
		listDirectory({}).catch(() => ({ members: [] })),
		listPublicSubmissions({ limit: 500 }).catch(() => [])
	]);

	const entries = [
		...STATIC_ROUTES.map((r) => urlTag(base + r, null, r === '/' ? '1.0' : '0.7')),
		...members.map((m) => urlTag(`${base}/members/${m.profile_id}`, null, '0.6')),
		...submissions.map((s) => urlTag(`${base}/writing/${s.$id}`, s.$updatedAt, '0.6'))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: { 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' }
	});
}
