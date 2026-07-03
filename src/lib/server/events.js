/**
 * Meetups managed by admins from the dashboard. Rows may be entered manually or
 * mirror a Luma listing; these rows power the public upcoming-events listing and
 * the past-meetups archive.
 */
import { createRow, deleteRow, listAllRows, updateRow, Query } from './data.js';
import { TABLES, EVENT_SOURCES } from '$lib/constants.js';
import { requireString, cleanString, optionalUrl, ensureOneOf } from './validation.js';
import { parseDateTimeLocal } from '$lib/format.js';

/**
 * Classify an event against the clock using both timestamps:
 *  - `upcoming`: hasn't started yet
 *  - `ongoing`:  started and, per `end_at`, not yet finished
 *  - `ended`:    finished (or started with no `end_at` to keep it live)
 * Returns null for undated events, which don't sit on the timeline.
 */
export function eventStatus(event, now = Date.now()) {
	const start = event.start_at ? Date.parse(event.start_at) : NaN;
	if (Number.isNaN(start)) return null;
	if (now < start) return 'upcoming';
	const end = event.end_at ? Date.parse(event.end_at) : NaN;
	if (!Number.isNaN(end) && now < end) return 'ongoing';
	return 'ended';
}

export function serializeEvent(row) {
	return {
		id: row.$id,
		title: row.title,
		start_at: row.start_at ?? null,
		end_at: row.end_at ?? null,
		location: row.location ?? '',
		description: row.description ?? '',
		source: row.source ?? 'manual',
		external_url: row.external_url ?? '',
		status: eventStatus(row)
	};
}

export async function listAllEvents() {
	const rows = await listAllRows(TABLES.events, [Query.orderAsc('start_at')]);
	return rows;
}

/** Events that haven't started yet, soonest first. */
export async function listUpcomingEvents(limit = 6) {
	const now = Date.now();
	const rows = await listAllEvents();
	return rows.filter((e) => eventStatus(e, now) === 'upcoming').slice(0, limit);
}

/** Events happening right now (started, not yet ended), soonest-started first. */
export async function listOngoingEvents(limit = 6) {
	const now = Date.now();
	const rows = await listAllEvents();
	return rows.filter((e) => eventStatus(e, now) === 'ongoing').slice(0, limit);
}

/**
 * Live events for the homepage/API: anything on now, then anything upcoming,
 * both soonest first.
 */
export async function listCurrentEvents(limit = 6) {
	const now = Date.now();
	const rows = await listAllEvents();
	const rank = { ongoing: 0, upcoming: 1 };
	return rows
		.map((e) => ({ e, status: eventStatus(e, now) }))
		.filter((x) => x.status === 'ongoing' || x.status === 'upcoming')
		.sort(
			(a, b) => rank[a.status] - rank[b.status] || Date.parse(a.e.start_at) - Date.parse(b.e.start_at)
		)
		.slice(0, limit)
		.map((x) => x.e);
}

/** Events that have ended, most recent first. */
export async function listPastEvents(limit = 24) {
	const now = Date.now();
	const rows = await listAllEvents();
	return rows
		.filter((e) => eventStatus(e, now) === 'ended')
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
	// Admin inputs are Bengaluru wall-clock; store as UTC.
	const start = parseDateTimeLocal(input.start_at);
	const end = parseDateTimeLocal(input.end_at);
	if (start) data.start_at = start;
	if (end) data.end_at = end;
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
