import { siteUrl } from '$lib/seo.js';

export const prerender = false;

// Allow public pages; keep member/admin/API areas out of the index.
export function GET() {
	const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /me
Disallow: /onboarding
Disallow: /submit
Disallow: /rewards
Disallow: /signin

Sitemap: ${siteUrl()}/sitemap.xml
`;
	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
}
