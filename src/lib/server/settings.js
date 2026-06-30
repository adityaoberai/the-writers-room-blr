/**
 * Editable site content stored as key/value rows in `site_settings`. Admins edit
 * these from the dashboard; public pages read them for hero copy, the Luma embed
 * and JSON blocks like benefits and testimonials.
 */
import { createRow, listAllRows, updateRow } from './data.js';
import { TABLES } from '$lib/constants.js';

export async function getAllSettings() {
	const rows = await listAllRows(TABLES.siteSettings);
	const map = {};
	for (const row of rows) map[row.key] = row.value ?? '';
	return map;
}

export function settingId(key) {
	return `setting_${key}`;
}

export async function setSetting(key, value) {
	const id = settingId(key);
	const data = { key, value: value ?? '' };
	try {
		return await updateRow(TABLES.siteSettings, id, { value: data.value });
	} catch (err) {
		if (err?.code === 404) return createRow(TABLES.siteSettings, id, data);
		throw err;
	}
}

/** Parse a JSON-valued setting, returning `fallback` if missing or malformed. */
export function parseJson(value, fallback) {
	if (!value) return fallback;
	try {
		const parsed = JSON.parse(value);
		return parsed ?? fallback;
	} catch {
		return fallback;
	}
}
