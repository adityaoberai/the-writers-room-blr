import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { TextDecoder } from 'node:util';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import { parse } from 'parse5';
import { CONTENT_TYPES, DEFAULT_SUBMISSION_IMAGE } from '$lib/constants.js';
import { cleanString } from './validation.js';

export { DEFAULT_SUBMISSION_IMAGE };

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const CACHE_RETRY_MS = 1000 * 60 * 10;
const MAX_CACHE_ENTRIES = 500;
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

const globalIpv6 = new BlockList();
globalIpv6.addSubnet('2000::', 3, 'ipv6');
const reservedIpv6 = new BlockList();
reservedIpv6.addSubnet('2001::', 23, 'ipv6');
reservedIpv6.addSubnet('2001:db8::', 32, 'ipv6');
reservedIpv6.addSubnet('2002::', 16, 'ipv6');
reservedIpv6.addSubnet('3fff::', 20, 'ipv6');

const hostAddress = (url) => url.hostname.replace(/^\[|\]$/g, '');

function isPrivateAddress(address) {
	const version = isIP(address);

	if (version === 4) {
		const [a, b, c] = address.split('.').map(Number);
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)))) ||
			(a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
			(a === 203 && b === 0 && c === 113) ||
			a >= 224
		);
	}

	if (version === 6) {
		return !globalIpv6.check(address, 'ipv6') || reservedIpv6.check(address, 'ipv6');
	}

	return true;
}

function publicHttpUrl(input, base) {
	if (!input) return null;
	let url;
	try {
		url = new URL(input, base);
	} catch {
		return null;
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
	if (url.username || url.password) return null;
	const hostname = hostAddress(url).replace(/\.$/, '');
	if (hostname === 'localhost' || hostname.endsWith('.localhost')) return null;
	if (isIP(hostname) && isPrivateAddress(hostname)) return null;

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
	if (stream !== response) response.on('error', (err) => stream.destroy(err));
	const decoder = new TextDecoder();
	let html = '';
	let bytes = 0;

	try {
		for await (const chunk of stream) {
			const prefix = chunk.subarray(0, MAX_HTML_BYTES - bytes);
			bytes += prefix.byteLength;
			html += decoder.decode(prefix, { stream: true });
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
 * Resolve and verify each redirect target, then connect using those same DNS
 * results while keeping the original hostname for the Host header and TLS.
 */
async function attemptHtml(url, signal, redirects = 0) {
	if (!url || signal.aborted || redirects > MAX_REDIRECTS) return null;
	const addresses = await lookup(hostAddress(url), { all: true }).catch(() => []);
	if (
		signal.aborted ||
		!addresses.length ||
		addresses.some(({ address }) => isPrivateAddress(address))
	) {
		return null;
	}

	const send = url.protocol === 'https:' ? httpsRequest : httpRequest;

	try {
		const response = await new Promise((resolve, reject) => {
			const req = send(
				url,
				{
					method: 'GET',
					agent: false,
					signal,
					lookup: (_, { all }, callback) => {
						if (all) callback(null, addresses);
						else callback(null, addresses[0].address, addresses[0].family);
					},
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
			response.destroy();
			return attemptHtml(publicHttpUrl(response.headers.location, url), signal, redirects + 1);
		}

		if (status < 200 || status >= 300) {
			response.destroy();
			return RETRYABLE_STATUSES.has(status) ? RETRYABLE : null;
		}

		const contentType = response.headers['content-type'] ?? '';
		if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
			response.destroy();
			return null;
		}

		return { html: await readHtmlPrefix(response), url: url.href };
	} catch {
		return signal.aborted ? null : RETRYABLE;
	}
}

async function retryHtml(url, signal) {
	for (let attempt = 1; ; attempt++) {
		const result = await attemptHtml(url, signal);
		if (result !== RETRYABLE) return result;
		if (attempt >= MAX_ATTEMPTS) return null;
		await delay(RETRY_DELAY_MS * attempt);
	}
}

/** A single deadline covers DNS, redirects, retries and the response body. */
async function fetchHtml(url) {
	const controller = new AbortController();
	let timer;
	const deadline = new Promise((resolve) => {
		timer = setTimeout(() => {
			controller.abort();
			resolve(null);
		}, FETCH_TIMEOUT_MS);
	});
	try {
		return await Promise.race([retryHtml(url, controller.signal), deadline]);
	} finally {
		clearTimeout(timer);
	}
}

function extractPreview(html, pageUrl) {
	const document = parse(html);
	const root = document.childNodes.find((node) => node.tagName === 'html');
	const head = root?.childNodes.find((node) => node.tagName === 'head');
	const pageTitle = head?.childNodes.find((node) => node.tagName === 'title')?.childNodes[0]?.value;
	const metadata = new Map();

	// Some SSR frameworks stream page metadata into the body. Visit the head
	// first so its metadata wins when the same field appears twice.
	const pending = [document];
	while (pending.length) {
		const node = pending.pop();
		for (let i = (node.childNodes?.length ?? 0) - 1; i >= 0; i--) {
			pending.push(node.childNodes[i]);
		}
		if (node.tagName !== 'meta') continue;
		const attribute = (name) => node.attrs.find((attr) => attr.name === name)?.value.trim();
		const key = (attribute('property') || attribute('name'))?.toLowerCase();
		const value = attribute('content');
		if (!key || !value) continue;
		if (!metadata.has(key)) metadata.set(key, []);
		metadata.get(key).push(value);
	}

	const first = (...keys) => keys.map((key) => metadata.get(key)?.[0]).find(Boolean) ?? '';
	const imageUrl = [
		'og:image:secure_url',
		'og:image',
		'og:image:url',
		'twitter:image',
		'twitter:image:src'
	]
		.flatMap((key) => metadata.get(key) ?? [])
		.map((value) => publicHttpUrl(value, pageUrl))
		.find((url) => url?.protocol === 'https:' && url.href.length <= 2048);
	const type = first('og:type').toLowerCase();

	return {
		title: cleanString(
			(first('og:title', 'twitter:title') || pageTitle || '').replace(/\s+/g, ' '),
			{ max: 256 }
		),
		summary: cleanString(
			first('og:description', 'twitter:description', 'description').replace(/\s+/g, ' '),
			{
				max: 1024
			}
		),
		imageUrl: imageUrl?.href ?? '',
		contentType: CONTENT_TYPES.includes(type) ? type : ''
	};
}

async function fetchPreview(url) {
	const page = await fetchHtml(url);
	return page?.html ? extractPreview(page.html, page.url) : null;
}

export async function resolveSubmissionPreview(externalUrl) {
	const url = publicHttpUrl(externalUrl);
	if (!url) return null;
	url.hash = '';
	const key = url.href;

	const cached = previewCache.get(key);
	if (cached && cached.expiresAt > Date.now()) return cached.promise;
	previewCache.delete(key);
	if (previewCache.size >= MAX_CACHE_ENTRIES) {
		previewCache.delete(previewCache.keys().next().value);
	}

	const promise = fetchPreview(url).catch(() => null);
	const entry = { promise, expiresAt: Date.now() + CACHE_RETRY_MS };
	previewCache.set(key, entry);

	const value = await promise;
	entry.expiresAt = Date.now() + (value?.imageUrl ? CACHE_TTL_MS : CACHE_RETRY_MS);
	return value;
}

export async function resolveSubmissionPreviewImage(externalUrl) {
	const preview = await resolveSubmissionPreview(externalUrl);
	return preview?.imageUrl || DEFAULT_SUBMISSION_IMAGE;
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
