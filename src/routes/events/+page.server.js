import {
	listOngoingEvents,
	listUpcomingEvents,
	listPastEvents,
	serializeEvent
} from '$lib/server/events.js';
import { getAllSettings } from '$lib/server/settings.js';

export async function load() {
	const [ongoing, upcoming, past, settings] = await Promise.all([
		listOngoingEvents(12),
		listUpcomingEvents(12),
		listPastEvents(24),
		getAllSettings()
	]);
	return {
		ongoing: ongoing.map(serializeEvent),
		upcoming: upcoming.map(serializeEvent),
		past: past.map(serializeEvent),
		luma_url: settings.luma_url || 'https://luma.com/the-writers-room'
	};
}
