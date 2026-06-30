/**
 * Lists meetup photos placed in `static/events-gallery/`. Static files can't be
 * globbed by Vite (the public dir is off-limits to imports), so we read the
 * directory at request time and serve the files by their public URL
 * (`/events-gallery/<file>`). Candidate paths cover both dev (`static/…`) and
 * the adapter-node build output (`build/client/…`).
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CANDIDATE_DIRS = [
	'static/events-gallery',
	'build/client/events-gallery',
	'client/events-gallery'
];
const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

export function listGalleryPhotos() {
	for (const dir of CANDIDATE_DIRS) {
		try {
			const abs = join(process.cwd(), dir);
			if (!existsSync(abs)) continue;
			const files = readdirSync(abs)
				.filter((f) => IMAGE_RE.test(f))
				.sort((a, b) => a.localeCompare(b));
			if (files.length) return files.map((f) => `/events-gallery/${f}`);
		} catch {
			// Ignore unreadable candidates and try the next.
		}
	}
	return [];
}
