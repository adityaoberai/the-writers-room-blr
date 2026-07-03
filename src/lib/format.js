// Date/number formatting helpers. Events are shown in Bengaluru's timezone.
const TZ = 'Asia/Kolkata';
// IST is a fixed offset with no daylight saving, so we can treat it as a constant.
const IST_OFFSET = '+05:30';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Convert a zoneless `<input type="datetime-local">` value (which the admin
 * enters as Bengaluru wall-clock time) into a UTC ISO string for storage.
 * Returns null for empty/invalid input.
 */
export function parseDateTimeLocal(value) {
	const trimmed = String(value ?? '').trim();
	if (!trimmed) return null;
	const hasZone = /([+-]\d{2}:?\d{2}|Z)$/i.test(trimmed);
	const d = new Date(hasZone ? trimmed : `${trimmed}${IST_OFFSET}`);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Convert a stored UTC ISO string back into a `datetime-local` value
 * (`YYYY-MM-DDTHH:mm`) expressed in Bengaluru wall-clock time, for pre-filling
 * the admin edit form. Returns '' for empty/invalid input.
 */
export function toDateTimeLocal(iso) {
	const t = Date.parse(iso ?? '');
	if (Number.isNaN(t)) return '';
	return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 16);
}

export function formatDate(iso, opts = {}) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return new Intl.DateTimeFormat('en-IN', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: TZ,
		...opts
	}).format(d);
}

export function formatTime(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return new Intl.DateTimeFormat('en-IN', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: TZ
	}).format(d);
}

export function formatDateTime(iso) {
	if (!iso) return '';
	return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatNumber(n) {
	return new Intl.NumberFormat('en-IN').format(n ?? 0);
}
