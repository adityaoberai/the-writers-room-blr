/**
 * Profile-photo uploads. Files are validated server-side, stored in the
 * public-read bucket, and referenced by their Appwrite file view URL.
 */
import { InputFile } from 'node-appwrite/file';
import { adminStorage, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, ID } from './appwrite.js';
import { PHOTO_BUCKET_ID } from '$lib/constants.js';
import { ValidationError } from './validation.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function fileViewUrl(fileId) {
	return `${APPWRITE_ENDPOINT}/storage/buckets/${PHOTO_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

export async function uploadProfilePhoto(file) {
	if (!file || typeof file.arrayBuffer !== 'function') {
		throw new ValidationError('No image was uploaded.');
	}
	if (!ALLOWED.includes(file.type)) {
		throw new ValidationError('Use a JPG, PNG, WEBP or GIF image.');
	}
	if (file.size > MAX_BYTES) {
		throw new ValidationError('Image must be 5MB or smaller.');
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const safeName = (file.name || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
	const created = await adminStorage().createFile({
		bucketId: PHOTO_BUCKET_ID,
		fileId: ID.unique(),
		file: InputFile.fromBuffer(buffer, safeName)
	});
	return { fileId: created.$id, url: fileViewUrl(created.$id) };
}
