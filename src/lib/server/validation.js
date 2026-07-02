/**
 * Server-side input validation, normalisation and safe rendering helpers.
 * Every value that originates from a client passes through here before it is
 * stored or rendered, satisfying the spec's server-side validation and
 * safe-rich-text requirements.
 */

export class ValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ValidationError';
		this.status = 400;
	}
}

export function escapeHtml(value) {
	return String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function cleanString(value, { max = 1000, trim = true } = {}) {
	let str = typeof value === 'string' ? value : value == null ? '' : String(value);
	if (trim) str = str.trim();
	if (str.length > max) str = str.slice(0, max);
	return str;
}

export function requireString(value, field, { min = 1, max = 1000 } = {}) {
	const str = cleanString(value, { max });
	if (str.length < min) throw new ValidationError(`${field} is required.`);
	return str;
}

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export function isValidUrl(value) {
	return typeof value === 'string' && URL_RE.test(value.trim());
}

export function optionalUrl(value, field) {
	const str = cleanString(value, { max: 2048 });
	if (!str) return '';
	if (!isValidUrl(str)) throw new ValidationError(`${field} must be a valid http(s) URL.`);
	return str;
}

export function isValidEmail(value) {
	return typeof value === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

/** Normalise a list of free-text tags/genres: trim, de-dupe, cap count and length. */
export function cleanTagList(value, { max = 12, maxLen = 64 } = {}) {
	let arr = value;
	if (typeof value === 'string') arr = value.split(',');
	if (!Array.isArray(arr)) return [];
	const seen = new Set();
	const out = [];
	for (const raw of arr) {
		const tag = cleanString(raw, { max: maxLen });
		if (!tag) continue;
		const key = tag.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(tag);
		if (out.length >= max) break;
	}
	return out;
}

/**
 * Normalise profile links into `{ label, url }` objects, dropping anything
 * without a valid URL. Stored as a JSON string in the `links` text column.
 */
export function cleanLinks(value, { max = 8 } = {}) {
	let arr = value;
	if (typeof value === 'string') {
		try {
			arr = JSON.parse(value);
		} catch {
			arr = [];
		}
	}
	if (!Array.isArray(arr)) return [];
	const out = [];
	for (const raw of arr) {
		if (!raw || typeof raw !== 'object') continue;
		const url = cleanString(raw.url, { max: 2048 });
		if (!isValidUrl(url)) continue;
		const label = cleanString(raw.label, { max: 60 }) || hostLabel(url);
		out.push({ label, url });
		if (out.length >= max) break;
	}
	return out;
}

function hostLabel(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return 'Link';
	}
}

export function ensureOneOf(value, allowed, field) {
	if (!allowed.includes(value)) throw new ValidationError(`Invalid ${field}.`);
	return value;
}
