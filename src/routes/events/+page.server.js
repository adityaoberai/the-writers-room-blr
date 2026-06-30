import { listPastEvents, serializeEvent } from '$lib/server/events.js';
import { getAllSettings } from '$lib/server/settings.js';

export async function load() {
	const [past, settings] = await Promise.all([listPastEvents(24), getAllSettings()]);
	return {
		past: past.map(serializeEvent),
		luma_embed_url: settings.luma_embed_url || '',
		luma_url: settings.luma_url || 'https://luma.com/the-writers-room'
	};
}
