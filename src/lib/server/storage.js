/**
 * Profile-photo uploads. Files are validated server-side, stored in the
 * public-read bucket, and referenced by their Appwrite file view URL.
 */
import { InputFile } from 'node-appwrite/file';
import { adminStorage, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, ID } from './appwrite.js';
import { PHOTO_BUCKET_ID } from '$lib/constants.js';
import { ValidationError } from './validation.js';

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_TYPE = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif'
};
const ALLOWED = Object.keys(EXTENSION_BY_TYPE);
const ALLOWED_EXTENSION_RE = /\.(?:jpe?g|png|webp|gif|avif)$/i;

export function fileViewUrl(fileId) {
	return `${APPWRITE_ENDPOINT}/storage/buckets/${PHOTO_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

export async function uploadProfilePhoto(file) {
	if (!file || typeof file.arrayBuffer !== 'function' || !file.size) {
		throw new ValidationError('No image was uploaded.');
	}
	if (!ALLOWED.includes(file.type)) {
		throw new ValidationError('Use a JPG, PNG, WEBP, AVIF or GIF image.');
	}
	if (file.size > MAX_BYTES) {
		throw new ValidationError('Image must be 5MB or smaller.');
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const safeName = profilePhotoFileName(file);
	const created = await adminStorage().createFile({
		bucketId: PHOTO_BUCKET_ID,
		fileId: ID.unique(),
		file: InputFile.fromBuffer(buffer, safeName)
	});
	return { fileId: created.$id, url: fileViewUrl(created.$id) };
}

export function profilePhotoFileName(file) {
	const extension = EXTENSION_BY_TYPE[file.type] ?? 'jpg';
	const fallback = `photo.${extension}`;
	const sanitized = String(file.name || fallback)
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/^_+/, '')
		.slice(0, 64);

	if (!sanitized) return fallback;
	if (ALLOWED_EXTENSION_RE.test(sanitized)) return sanitized;

	const base = sanitized.replace(/\.[^.]*$/, '').slice(0, 58) || 'photo';
	return `${base}.${extension}`;
}
