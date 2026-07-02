/**
 * Image uploads (profile photos and submission cover images). Files are
 * validated server-side, stored in a public-read bucket, and referenced by
 * their Appwrite file view URL.
 */
import { InputFile } from 'node-appwrite/file';
import { adminStorage, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, ID } from './appwrite.js';
import { PHOTO_BUCKET_ID, SUBMISSION_IMAGE_BUCKET_ID } from '$lib/constants.js';
import { ValidationError } from './validation.js';

const MB = 1024 * 1024;
const PROFILE_PHOTO_MAX_BYTES = 5 * MB;
const SUBMISSION_IMAGE_MAX_BYTES = 100 * MB;
const EXTENSION_BY_TYPE = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif'
};
const ALLOWED = Object.keys(EXTENSION_BY_TYPE);
const ALLOWED_EXTENSION_RE = /\.(?:jpe?g|png|webp|gif|avif)$/i;

export function fileViewUrl(fileId, bucketId = PHOTO_BUCKET_ID) {
	return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

/** Validate an uploaded image and store it in `bucketId`. Returns its view URL. */
async function uploadImage(file, { bucketId, base = 'image', maxBytes = PROFILE_PHOTO_MAX_BYTES }) {
	if (!file || typeof file.arrayBuffer !== 'function' || !file.size) {
		throw new ValidationError('No image was uploaded.');
	}
	if (!ALLOWED.includes(file.type)) {
		throw new ValidationError('Use a JPG, PNG, WEBP, AVIF or GIF image.');
	}
	if (file.size > maxBytes) {
		throw new ValidationError(`Image must be ${Math.round(maxBytes / MB)}MB or smaller.`);
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const safeName = imageFileName(file, base);
	const created = await adminStorage().createFile({
		bucketId,
		fileId: ID.unique(),
		file: InputFile.fromBuffer(buffer, safeName)
	});
	return { fileId: created.$id, url: fileViewUrl(created.$id, bucketId) };
}

export async function uploadProfilePhoto(file) {
	return uploadImage(file, {
		bucketId: PHOTO_BUCKET_ID,
		base: 'photo',
		maxBytes: PROFILE_PHOTO_MAX_BYTES
	});
}

export async function uploadSubmissionImage(file) {
	return uploadImage(file, {
		bucketId: SUBMISSION_IMAGE_BUCKET_ID,
		base: 'cover',
		maxBytes: SUBMISSION_IMAGE_MAX_BYTES
	});
}

export function imageFileName(file, base = 'image') {
	const extension = EXTENSION_BY_TYPE[file.type] ?? 'jpg';
	const fallback = `${base}.${extension}`;
	const sanitized = String(file.name || fallback)
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/^_+/, '')
		.slice(0, 64);

	if (!sanitized) return fallback;
	if (ALLOWED_EXTENSION_RE.test(sanitized)) return sanitized;

	const cut = sanitized.replace(/\.[^.]*$/, '').slice(0, 58) || base;
	return `${cut}.${extension}`;
}
