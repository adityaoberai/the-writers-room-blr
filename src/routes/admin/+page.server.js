import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/guards.js';
import { getDashboardData } from '$lib/server/admin.js';
import { getAllSettings, setSetting, parseJson } from '$lib/server/settings.js';
import { setProfileListed, setFeatured } from '$lib/server/profiles.js';
import { setUserAdmin } from '$lib/server/users.js';
import {
	moderateSubmission,
	listPublicSubmissions,
	serializeSubmission
} from '$lib/server/submissions.js';
import { getAuthorsForUserIds } from '$lib/server/profiles.js';
import { recomputeBadges } from '$lib/server/rewards.js';
import { setFeedbackStatus } from '$lib/server/feedback.js';
import {
	listAllEvents,
	serializeEvent,
	createEvent,
	updateEvent,
	deleteEvent
} from '$lib/server/events.js';

const EDITABLE_SETTINGS = [
	{ key: 'hero_title', label: 'Hero title', type: 'text' },
	{ key: 'hero_subtitle', label: 'Hero subtitle', type: 'textarea' },
	{ key: 'mission', label: 'Mission statement', type: 'textarea' },
	{ key: 'luma_url', label: 'Luma calendar URL', type: 'text' }
];

export async function load({ locals }) {
	requireAdmin(locals);
	const [dashboard, settings, events, approved] = await Promise.all([
		getDashboardData(),
		getAllSettings(),
		listAllEvents(),
		listPublicSubmissions({ limit: 100 })
	]);
	const authors = await getAuthorsForUserIds(approved.map((s) => s.user_id));

	return {
		dashboard,
		settings,
		editableSettings: EDITABLE_SETTINGS,
		benefits: parseJson(settings.benefits, []),
		currentUserId: locals.user.$id,
		events: events.map(serializeEvent),
		approvedSubmissions: approved.map((s) =>
			serializeSubmission(s, { author: authors[s.user_id] ?? null })
		)
	};
}

const ok = (message) => ({ success: message });

export const actions = {
	setMemberListed: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		const listed = fd.get('listed') === 'true';
		try {
			await setProfileListed(String(fd.get('profile_id')), listed);
			return ok(listed ? 'Member listed in the directory.' : 'Member unlisted.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	setMemberAdmin: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		const userId = String(fd.get('user_id'));
		const makeAdmin = fd.get('make_admin') === 'true';
		if (userId === locals.user.$id) {
			return fail(400, { error: "You can't change your own admin status." });
		}
		try {
			await setUserAdmin(userId, makeAdmin);
			return ok(makeAdmin ? 'Member promoted to admin.' : 'Admin access removed.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	featureMember: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		try {
			await setFeatured(String(fd.get('profile_id')), fd.get('featured') === 'true');
			return ok('Member spotlight updated.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	moderateSubmission: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		try {
			const row = await moderateSubmission(String(fd.get('id')), {
				status: String(fd.get('status')),
				note: String(fd.get('moderation_note') || ''),
				adminId: locals.user.$id
			});
			await recomputeBadges(row.user_id);
			return ok('Submission moderated.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	featureSubmission: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		try {
			const row = await moderateSubmission(String(fd.get('id')), {
				featured: fd.get('featured') === 'true',
				adminId: locals.user.$id
			});
			await recomputeBadges(row.user_id);
			return ok('Featured writing updated.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	setFeedbackStatus: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		try {
			await setFeedbackStatus(String(fd.get('id')), {
				status: String(fd.get('status')),
				adminId: locals.user.$id
			});
			return ok('Feedback updated.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	saveSetting: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		try {
			await setSetting(String(fd.get('key')), String(fd.get('value') ?? ''));
			return ok('Site content updated.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	// The whole benefits ledger is saved in one go: the form posts one `title`,
	// `body` and `icon` field per row, in display order.
	saveBenefits: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		const bodies = fd.getAll('body');
		const icons = fd.getAll('icon');
		const benefits = fd
			.getAll('title')
			.map((title, i) => ({
				title: String(title).trim(),
				body: String(bodies[i] ?? '').trim(),
				icon: String(icons[i] ?? '').trim() || 'pen'
			}))
			.filter((b) => b.title || b.body);

		if (benefits.some((b) => !b.title)) {
			return fail(400, { error: 'Every benefit needs a title.' });
		}
		// The homepage keys its ledger by title, so duplicates would break rendering.
		const titles = new Set(benefits.map((b) => b.title.toLowerCase()));
		if (titles.size !== benefits.length) {
			return fail(400, { error: 'Benefit titles must be unique.' });
		}

		try {
			await setSetting('benefits', JSON.stringify(benefits));
			return ok('Benefits updated.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	createEvent: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		try {
			await createEvent({
				title: fd.get('title'),
				start_at: fd.get('start_at') || undefined,
				end_at: fd.get('end_at') || undefined,
				location: fd.get('location'),
				description: fd.get('description'),
				external_url: fd.get('external_url'),
				source: 'manual'
			});
			return ok('Event added.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	updateEvent: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		try {
			await updateEvent(String(fd.get('id')), {
				title: fd.get('title'),
				start_at: fd.get('start_at') || undefined,
				end_at: fd.get('end_at') || undefined,
				location: fd.get('location'),
				description: fd.get('description'),
				external_url: fd.get('external_url'),
				source: fd.get('source') || 'manual'
			});
			return ok('Event updated.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	deleteEvent: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		try {
			await deleteEvent(String(fd.get('id')));
			return ok('Event removed.');
		} catch (err) {
			return fail(400, { error: err.message });
		}
	}
};
