import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { TextDecoder } from 'node:util';

export const DEFAULT_SUBMISSION_IMAGE = '/og.png';

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const CACHE_RETRY_MS = 1000 * 60 * 10;
const FETCH_TIMEOUT_MS = 4000;
const MAX_HTML_BYTES = 160 * 1024;
const MAX_REDIRECTS = 3;
const CONCURRENCY = 6;

const previewCache = new Map();

function timeoutController(ms) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), ms);
	return {
		signal: controller.signal,
		clear: () => clearTimeout(timeout)
	};
}

function isBlockedHostname(hostname) {
	const host = hostname
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/\.$/, '');
	return (
		host === 'localhost' ||
		host.endsWith('.localhost') ||
		host === '0.0.0.0' ||
		host === '::' ||
		host === '::1'
	);
}

function isPrivateAddress(address) {
	const version = isIP(address);

	if (version === 4) {
		const [a, b] = address.split('.').map(Number);
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			a >= 224
		);
	}

	if (version === 6) {
		const lower = address.toLowerCase();
		return (
			lower === '::' ||
			lower === '::1' ||
			lower.startsWith('fc') ||
			lower.startsWith('fd') ||
			lower.startsWith('fe80:') ||
			lower.startsWith('::ffff:')
		);
	}

	return true;
}

async function publicHttpUrl(input) {
	let url;
	try {
		url = new URL(input);
	} catch {
		return null;
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
	if (isBlockedHostname(url.hostname)) return null;

	const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
	if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) return null;

	return url;
}

async function readHtmlPrefix(response) {
	const reader = response.body?.getReader();
	if (!reader) return response.text();

	const decoder = new TextDecoder();
	let html = '';
	let bytes = 0;

	while (bytes < MAX_HTML_BYTES) {
		const { done, value } = await reader.read();
		if (done) break;

		bytes += value.byteLength;
		html += decoder.decode(value, { stream: true });
	}

	await reader.cancel().catch(() => {});
	return html + decoder.decode();
}

async function fetchHtml(input, redirects = 0) {
	const url = await publicHttpUrl(input);
	if (!url || redirects > MAX_REDIRECTS) return null;

	const timeout = timeoutController(FETCH_TIMEOUT_MS);
	try {
		const response = await fetch(url, {
			redirect: 'manual',
			signal: timeout.signal,
			headers: {
				accept: 'text/html,application/xhtml+xml',
				'user-agent': 'TheWritersRoomBLR/1.0 (+https://thewritersroomblr.com)'
			}
		});

		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location');
			if (!location) return null;
			return fetchHtml(new URL(location, url).href, redirects + 1);
		}

		if (!response.ok) return null;

		const contentType = response.headers.get('content-type') ?? '';
		if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) return null;

		return {
			html: await readHtmlPrefix(response),
			url: url.href
		};
	} catch {
		return null;
	} finally {
		timeout.clear();
	}
}

function decodeHtmlEntities(value) {
	return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (match, entity) => {
		const normalized = entity.toLowerCase();
		if (normalized === 'amp') return '&';
		if (normalized === 'quot') return '"';
		if (normalized === 'apos') return "'";
		if (normalized === 'lt') return '<';
		if (normalized === 'gt') return '>';

		const codePoint = normalized.startsWith('#x')
			? Number.parseInt(normalized.slice(2), 16)
			: Number.parseInt(normalized.slice(1), 10);

		if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
		return String.fromCodePoint(codePoint);
	});
}

function attributesFor(tag) {
	const attributes = new Map();
	const attributeRe = /([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
	let match;

	while ((match = attributeRe.exec(tag))) {
		attributes.set(
			match[1].toLowerCase(),
			decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '')
		);
	}

	return attributes;
}

function extractPreviewImage(html, pageUrl) {
	const metaRe = /<meta\b[^>]*>/gi;
	const candidates = [];
	const imageKeys = new Set([
		'og:image:secure_url',
		'og:image',
		'twitter:image',
		'twitter:image:src'
	]);
	let match;

	while ((match = metaRe.exec(html))) {
		const attributes = attributesFor(match[0]);
		const key = (attributes.get('property') ?? attributes.get('name') ?? '').toLowerCase();
		const content = attributes.get('content');

		if (content && imageKeys.has(key)) {
			candidates.push(content.trim());
		}
	}

	for (const candidate of candidates) {
		try {
			const imageUrl = new URL(candidate, pageUrl);
			if (imageUrl.protocol === 'https:') return imageUrl.href;
		} catch {
			// Ignore malformed metadata and try the next candidate.
		}
	}

	return '';
}

async function fetchPreviewImage(externalUrl) {
	const page = await fetchHtml(externalUrl);
	if (!page?.html) return DEFAULT_SUBMISSION_IMAGE;

	return extractPreviewImage(page.html, page.url) || DEFAULT_SUBMISSION_IMAGE;
}

export async function resolveSubmissionPreviewImage(externalUrl) {
	if (!externalUrl) return DEFAULT_SUBMISSION_IMAGE;

	const key = String(externalUrl).trim();
	if (!key) return DEFAULT_SUBMISSION_IMAGE;

	const cached = previewCache.get(key);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.value ?? cached.promise;
	}

	const promise = fetchPreviewImage(key).catch(() => DEFAULT_SUBMISSION_IMAGE);
	previewCache.set(key, { promise, expiresAt: Date.now() + CACHE_RETRY_MS });

	const value = await promise;
	previewCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
	return value;
}

async function mapLimit(items, limit, mapper) {
	const results = Array(items.length);
	let index = 0;

	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (index < items.length) {
				const current = index;
				index += 1;
				results[current] = await mapper(items[current], current);
			}
		})
	);

	return results;
}

export async function withSubmissionPreviewImages(submissions) {
	const images = await mapLimit(submissions, CONCURRENCY, (submission) => {
		// A creator-uploaded image (already set as preview_image) always wins;
		// only fall back to scraping the external link when there isn't one.
		if (submission.preview_image && submission.preview_image !== DEFAULT_SUBMISSION_IMAGE) {
			return submission.preview_image;
		}
		return resolveSubmissionPreviewImage(submission.external_url);
	});

	return submissions.map((submission, index) => ({
		...submission,
		preview_image: images[index] || DEFAULT_SUBMISSION_IMAGE
	}));
}
