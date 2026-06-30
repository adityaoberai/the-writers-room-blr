/**
 * Events shown alongside the Luma embed. Events may be entered manually by
 * admins or represent Luma listings; the live calendar itself is embedded as an
 * iframe, while these rows power the "upcoming" metadata and the archive.
 */
import { createRow, deleteRow, listAllRows, updateRow, Query } from './data.js';
import { TABLES, EVENT_SOURCES } from '$lib/constants.js';
import { requireString, cleanString, optionalUrl, ensureOneOf } from './validation.js';

export function serializeEvent(row) {
	return {
		id: row.$id,
		title: row.title,
		start_at: row.start_at ?? null,
		end_at: row.end_at ?? null,
		location: row.location ?? '',
		description: row.description ?? '',
		source: row.source ?? 'manual',
		external_url: row.external_url ?? ''
	};
}

export async function listAllEvents() {
	const rows = await listAllRows(TABLES.events, [Query.orderAsc('start_at')]);
	return rows;
}

export async function listUpcomingEvents(limit = 6) {
	const now = Date.now();
	const rows = await listAllEvents();
	return rows.filter((e) => e.start_at && Date.parse(e.start_at) >= now).slice(0, limit);
}

export async function listPastEvents(limit = 24) {
	const now = Date.now();
	const rows = await listAllEvents();
	return rows
		.filter((e) => e.start_at && Date.parse(e.start_at) < now)
		.sort((a, b) => Date.parse(b.start_at) - Date.parse(a.start_at))
		.slice(0, limit);
}

function buildEventData(input) {
	const data = {
		title: requireString(input.title, 'Title', { max: 256 }),
		location: cleanString(input.location, { max: 256 }),
		description: cleanString(input.description, { max: 4000, trim: false }).trim(),
		source: ensureOneOf(cleanString(input.source) || 'manual', EVENT_SOURCES, 'source')
	};
	const url = optionalUrl(input.external_url, 'External URL');
	if (url) data.external_url = url; // URL column rejects empty strings
	if (input.start_at) data.start_at = new Date(input.start_at).toISOString();
	if (input.end_at) data.end_at = new Date(input.end_at).toISOString();
	return data;
}

export async function createEvent(input) {
	return createRow(TABLES.events, 'unique()', buildEventData(input));
}

export async function updateEvent(id, input) {
	return updateRow(TABLES.events, id, buildEventData(input));
}

export async function deleteEvent(id) {
	return deleteRow(TABLES.events, id);
}
