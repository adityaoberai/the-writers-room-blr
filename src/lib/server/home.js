/** Composes the homepage payload shared by the page load and /api/public/home. */
import { getAllSettings, parseJson } from './settings.js';
import { listFeaturedProfiles, serializeProfile, getAuthorsForUserIds } from './profiles.js';
import { listFeaturedSubmissions, serializeSubmission } from './submissions.js';
import { listCurrentEvents, serializeEvent } from './events.js';
import { withSubmissionPreviewImages } from './link-preview.js';
import { countRows, Query } from './data.js';
import { TABLES } from '$lib/constants.js';

export async function getHomeData() {
	const [settings, featuredProfiles, featuredSubs, upcomingEvents, writers, pieces] =
		await Promise.all([
			getAllSettings(),
			listFeaturedProfiles(3),
			listFeaturedSubmissions(3),
			listCurrentEvents(3),
			countRows(TABLES.profiles, [Query.equal('is_public', true)]),
			countRows(TABLES.submissions, [Query.equal('status', ['approved', 'featured'])])
		]);

	const authors = await getAuthorsForUserIds(featuredSubs.map((s) => s.user_id));
	const featuredWriting = await withSubmissionPreviewImages(
		featuredSubs.map((s) => serializeSubmission(s, { author: authors[s.user_id] ?? null }))
	);

	return {
		hero: {
			title: settings.hero_title || "Where Bengaluru's writers gather.",
			subtitle: settings.hero_subtitle || ''
		},
		stats: { writers, pieces },
		featuredMembers: featuredProfiles.map(serializeProfile),
		featuredWriting,
		upcomingEvents: upcomingEvents.map(serializeEvent),
		siteCopy: {
			mission: settings.mission || '',
			meetup_format: settings.meetup_format || '',
			meetup_note: settings.meetup_note || '',
			readers_room: settings.readers_room || '',
			luma_url: settings.luma_url || 'https://lu.ma',
			benefits: parseJson(settings.benefits, []),
			testimonials: parseJson(settings.testimonials, [])
		}
	};
}
