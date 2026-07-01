/**
 * Member profiles and the public directory.
 *
 * Directory-visibility rule: a profile appears in the directory when its owner
 * has kept it public (`is_public`, member-controlled) AND an admin has not
 * unlisted it (`listed`, admin-controlled, defaults to true). Every member is
 * therefore listed by default; admins unlist/re-list from the dashboard.
 * Genre/keyword filtering is done in memory because Appwrite cannot index array
 * columns.
 */
import { createRow, listAllRows, tryGetRow, updateRow, Query } from './data.js';
import { TABLES } from '$lib/constants.js';
import { cleanString, cleanTagList, cleanLinks, requireString } from './validation.js';

export function parseLinks(value) {
	if (!value) return [];
	try {
		const arr = JSON.parse(value);
		return Array.isArray(arr) ? arr : [];
	} catch {
		return [];
	}
}

/** Public view of a profile (safe to expose; links honour the public flag). */
export function serializeProfile(profile) {
	return {
		profile_id: profile.$id,
		user_id: profile.user_id,
		display_name: profile.display_name,
		photo_url: profile.photo_url ?? '',
		bio: profile.bio ?? '',
		genres: profile.genres ?? [],
		links: profile.is_public ? parseLinks(profile.links) : [],
		location: profile.location ?? 'Bengaluru',
		is_public: !!profile.is_public,
		is_featured: !!profile.is_featured,
		listed: profile.listed !== false
	};
}

export async function getProfileByUserId(userId) {
	const rows = await listAllRows(TABLES.profiles, [Query.equal('user_id', userId), Query.limit(1)]);
	return rows[0] ?? null;
}

export async function getProfileById(profileId) {
	return tryGetRow(TABLES.profiles, profileId);
}

/** Map of user_id -> lightweight author info, for attaching to submissions. */
export async function getAuthorsForUserIds(userIds) {
	const unique = [...new Set(userIds.filter(Boolean))];
	if (!unique.length) return {};
	const rows = await listAllRows(TABLES.profiles, [Query.equal('user_id', unique)]);
	const map = {};
	for (const p of rows) {
		map[p.user_id] = {
			profile_id: p.$id,
			display_name: p.display_name,
			photo_url: p.photo_url ?? '',
			is_public: !!p.is_public
		};
	}
	return map;
}

/** Create a profile for a freshly registered user if one does not exist yet. */
export async function ensureProfile(userId, displayName) {
	const existing = await getProfileByUserId(userId);
	if (existing) return existing;
	return createRow(TABLES.profiles, 'unique()', {
		user_id: userId,
		display_name: displayName || 'New member',
		bio: '',
		genres: [],
		links: '[]',
		location: 'Bengaluru',
		is_public: true,
		is_featured: false,
		listed: true
	});
}

export async function updateProfile(userId, input) {
	const profile = await getProfileByUserId(userId);
	if (!profile) throw Object.assign(new Error('Profile not found.'), { status: 404 });

	const data = {};
	if (input.display_name !== undefined)
		data.display_name = requireString(input.display_name, 'Display name', { max: 128 });
	if (input.bio !== undefined) data.bio = cleanString(input.bio, { max: 4000, trim: false }).trim();
	if (input.genres !== undefined) data.genres = cleanTagList(input.genres);
	if (input.location !== undefined)
		data.location = cleanString(input.location, { max: 128 }) || 'Bengaluru';
	if (input.links !== undefined) data.links = JSON.stringify(cleanLinks(input.links));
	if (input.photo_url !== undefined) data.photo_url = cleanString(input.photo_url, { max: 2048 });
	if (input.is_public !== undefined) data.is_public = !!input.is_public;

	return updateRow(TABLES.profiles, profile.$id, data);
}

/** Parse the ProfileForm fields out of FormData and persist them. */
export async function saveProfileFromFormData(userId, formData) {
	const labels = formData.getAll('link_label');
	const urls = formData.getAll('link_url');
	const links = urls
		.map((u, i) => ({ url: String(u), label: String(labels[i] ?? '') }))
		.filter((l) => l.url.trim());

	return updateProfile(userId, {
		display_name: formData.get('display_name'),
		bio: formData.get('bio'),
		genres: formData.get('genres'),
		location: formData.get('location'),
		links,
		is_public: formData.get('is_public') === 'on' || formData.get('is_public') === 'true'
	});
}

export async function setProfilePhoto(userId, photoUrl) {
	const profile = await getProfileByUserId(userId);
	if (!profile) throw Object.assign(new Error('Profile not found.'), { status: 404 });
	return updateRow(TABLES.profiles, profile.$id, { photo_url: photoUrl });
}

/** A profile is "complete" once it has a name, a bio and at least one genre. */
export function isProfileComplete(profile) {
	if (!profile) return false;
	const bio = (profile.bio ?? '').trim();
	const genres = profile.genres ?? [];
	return !!profile.display_name && bio.length > 0 && genres.length >= 1;
}

/**
 * Build the directory listing with optional in-memory filters.
 * Returns `{ members, genres }` where `genres` is the union for filter chips.
 */
export async function listDirectory({ search = '', genre = '', focus = '' } = {}) {
	const profiles = await listAllRows(TABLES.profiles, [Query.equal('is_public', true)]);

	// Public by default; only admin-unlisted profiles (`listed === false`) are hidden.
	const visible = profiles.filter((p) => p.listed !== false);

	const genreSet = new Set();
	for (const p of visible) for (const g of p.genres ?? []) genreSet.add(g);

	const term = search.trim().toLowerCase();
	const genreFilter = genre.trim().toLowerCase();
	const focusFilter = focus.trim().toLowerCase();

	const members = visible
		.filter((p) => {
			if (genreFilter && !(p.genres ?? []).some((g) => g.toLowerCase() === genreFilter))
				return false;
			if (focusFilter && !(p.genres ?? []).some((g) => g.toLowerCase().includes(focusFilter)))
				return false;
			if (term) {
				const haystack = [p.display_name, p.bio, (p.genres ?? []).join(' '), p.location]
					.join(' ')
					.toLowerCase();
				if (!haystack.includes(term)) return false;
			}
			return true;
		})
		.map((p) => ({
			profile_id: p.$id,
			user_id: p.user_id,
			display_name: p.display_name,
			photo_url: p.photo_url ?? '',
			bio: p.bio ?? '',
			genres: p.genres ?? [],
			location: p.location ?? 'Bengaluru',
			is_featured: !!p.is_featured
		}))
		.sort((a, b) => {
			if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
			return a.display_name.localeCompare(b.display_name);
		});

	return { members, genres: [...genreSet].sort((a, b) => a.localeCompare(b)) };
}

export async function listFeaturedProfiles(limit = 3) {
	const rows = await listAllRows(TABLES.profiles, [
		Query.equal('is_featured', true),
		Query.equal('is_public', true)
	]);
	return rows.filter((p) => p.listed !== false).slice(0, limit);
}

/** All profiles for the admin moderation table, with their listing state. */
export async function listProfilesForModeration() {
	const profiles = await listAllRows(TABLES.profiles);
	return profiles.map((p) => ({
		profile: serializeProfile(p),
		listed: p.listed !== false,
		complete: isProfileComplete(p),
		raw_id: p.$id,
		user_id: p.user_id,
		created_at: p.$createdAt
	}));
}

/** Admin-controlled directory listing: show (true) or hide (false) a profile. */
export async function setProfileListed(profileId, listed) {
	const profile = await getProfileById(profileId);
	if (!profile) throw Object.assign(new Error('Profile not found.'), { status: 404 });
	return updateRow(TABLES.profiles, profileId, { listed: !!listed });
}

export async function setFeatured(profileId, isFeatured) {
	return updateRow(TABLES.profiles, profileId, { is_featured: !!isFeatured });
}
