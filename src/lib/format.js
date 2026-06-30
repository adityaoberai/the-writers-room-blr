// Date/number formatting helpers. Events are shown in Bengaluru's timezone.
const TZ = 'Asia/Kolkata';

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
