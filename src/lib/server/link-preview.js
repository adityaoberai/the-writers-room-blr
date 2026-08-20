import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { TextDecoder } from 'node:util';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import { DEFAULT_SUBMISSION_IMAGE } from '$lib/constants.js';

export { DEFAULT_SUBMISSION_IMAGE };

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const CACHE_RETRY_MS = 1000 * 60 * 10;
const FETCH_TIMEOUT_MS = 4000;
const MAX_HTML_BYTES = 160 * 1024;
const MAX_REDIRECTS = 3;
const CONCURRENCY = 6;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 250;
// Node's 16KB default rejects the response headers some CDNs emit outright
// ("Parse Error: Header overflow"), losing us the preview for the whole page.
const MAX_HEADER_BYTES = 64 * 1024;
const USER_AGENT = 'TheWritersRoomBLR/1.0 (+https://thewritersroom.club)';

/**
 * Statuses worth a second try: rate limits, gateway blips, and the throttled 403
 * some bot-protected hosts return under load.
 */
const RETRYABLE_STATUSES = new Set([403, 408, 425, 429, 500, 502, 503, 504]);

/** Returned by an attempt that failed in a way a later attempt might survive. */
const RETRYABLE = Symbol('retryable');

const previewCache = new Map();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

/** Unwrap a compressed body: hosts gzip regardless of what we ask for. */
function decodeStream(response) {
	const encoding = (response.headers['content-encoding'] ?? '').trim().toLowerCase();
	if (encoding === 'gzip' || encoding === 'x-gzip') return response.pipe(createGunzip());
	if (encoding === 'deflate') return response.pipe(createInflate());
	if (encoding === 'br') return response.pipe(createBrotliDecompress());
	return response;
}

/**
 * Read at most MAX_HTML_BYTES of decoded markup. The head metadata we're after
 * sits at the top of the document, so a prefix is enough - and capping
 * decompressed bytes rather than wire bytes also bounds a compression bomb.
 */
async function readHtmlPrefix(response) {
	const stream = decodeStream(response);
	const decoder = new TextDecoder();
	let html = '';
	let bytes = 0;

	try {
		for await (const chunk of stream) {
			bytes += chunk.byteLength;
			html += decoder.decode(chunk, { stream: true });
			if (bytes >= MAX_HTML_BYTES) break;
		}
	} finally {
		// Stopping early leaves the socket mid-body: tear down both ends of the
		// (possibly decompressing) pipeline so the connection is released.
		stream.destroy();
		response.destroy();
	}

	return html + decoder.decode();
}

/**
 * One fetch of a page's markup, over `node:http(s)` rather than the global
 * `fetch`. That choice is load-bearing: Cloudflare-fronted hosts (*.hashnode.dev
 * among them) reject Node's bundled undici client by fingerprint and 403 every
 * request no matter the headers, while the same request over this transport is
 * served normally.
 *
 * Redirects are followed by hand so publicHttpUrl re-validates every hop; an
 * automatic redirect chain would let a public URL bounce us into private address
 * space.
 */
async function attemptHtml(input, redirects = 0) {
	const url = await publicHttpUrl(input);
	if (!url || redirects > MAX_REDIRECTS) return null;

	const send = url.protocol === 'https:' ? httpsRequest : httpRequest;
	let timedOut = false;
	let req;

	// A hard deadline spanning headers *and* body, so a host that trickles bytes
	// can't hold a page render open past the budget.
	const deadline = setTimeout(() => {
		timedOut = true;
		req?.destroy();
	}, FETCH_TIMEOUT_MS);

	try {
		const response = await new Promise((resolve, reject) => {
			req = send(
				url,
				{
					method: 'GET',
					maxHeaderSize: MAX_HEADER_BYTES,
					headers: {
						accept: 'text/html,application/xhtml+xml',
						'accept-encoding': 'gzip, deflate, br, identity',
						'user-agent': USER_AGENT
					}
				},
				resolve
			);
			req.on('error', reject);
			req.end();
		});

		const status = response.statusCode ?? 0;

		if (status >= 300 && status < 400) {
			response.resume();
			const location = response.headers.location;
			if (!location) return null;
			return attemptHtml(new URL(location, url).href, redirects + 1);
		}

		if (status < 200 || status >= 300) {
			response.resume();
			return RETRYABLE_STATUSES.has(status) ? RETRYABLE : null;
		}

		const contentType = response.headers['content-type'] ?? '';
		if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
			response.destroy();
			return null;
		}

		return { html: await readHtmlPrefix(response), url: url.href };
	} catch {
		// A timeout has already spent the whole per-request budget, and retrying
		// would multiply it on a page render; other transport errors (reset
		// connection, truncated body) fail fast, so they're worth another attempt.
		return timedOut ? null : RETRYABLE;
	} finally {
		clearTimeout(deadline);
	}
}

/**
 * Fetch a page's HTML, retrying the transient failures. Every retried case
 * responds quickly (a throttled 403, a connection reset), so the added
 * worst-case latency stays well under a single FETCH_TIMEOUT_MS.
 */
async function fetchHtml(input) {
	for (let attempt = 1; ; attempt++) {
		const result = await attemptHtml(input);
		if (result !== RETRYABLE) return result;
		if (attempt >= MAX_ATTEMPTS) return null;
		await delay(RETRY_DELAY_MS * attempt);
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
	// Only a real hit earns the long TTL. Caching a miss for a day would let one
	// transient upstream block pin the fallback image for 24 hours.
	const ttl = value === DEFAULT_SUBMISSION_IMAGE ? CACHE_RETRY_MS : CACHE_TTL_MS;
	previewCache.set(key, { value, expiresAt: Date.now() + ttl });
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
