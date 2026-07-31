/**
 * File uploads (profile photos, submission cover images and feedback
 * attachments). Files are validated server-side, stored in a public-read
 * bucket, and referenced by their Appwrite file view URL.
 */
import { InputFile } from 'node-appwrite/file';
import { adminStorage, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, ID } from './appwrite.js';
import { PHOTO_BUCKET_ID, SUBMISSION_IMAGE_BUCKET_ID, FEEDBACK_BUCKET_ID } from '$lib/constants.js';
import { ValidationError } from './validation.js';

const MB = 1024 * 1024;
const PROFILE_PHOTO_MAX_BYTES = 5 * MB;
const SUBMISSION_IMAGE_MAX_BYTES = 100 * MB;
const FEEDBACK_ATTACHMENT_MAX_BYTES = 100 * MB;
const EXTENSION_BY_TYPE = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif'
};
// Feedback attachments also accept screen recordings.
const VIDEO_EXTENSION_BY_TYPE = {
	'video/mp4': 'mp4',
	'video/webm': 'webm',
	'video/quicktime': 'mov'
};
const ALLOWED_EXTENSION_RE = /\.(?:jpe?g|png|webp|gif|avif)$/i;
const ATTACHMENT_EXTENSION_RE = /\.(?:jpe?g|png|webp|gif|avif|mp4|webm|mov)$/i;

export function fileViewUrl(fileId, bucketId = PHOTO_BUCKET_ID) {
	return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

/** Validate an uploaded file and store it in `bucketId`. Returns its view URL. */
async function uploadFile(
	file,
	{
		bucketId,
		base = 'image',
		maxBytes = PROFILE_PHOTO_MAX_BYTES,
		extensionByType = EXTENSION_BY_TYPE,
		extensionRe = ALLOWED_EXTENSION_RE,
		typeError = 'Use a JPG, PNG, WEBP, AVIF or GIF image.'
	}
) {
	if (!file || typeof file.arrayBuffer !== 'function' || !file.size) {
		throw new ValidationError('No file was uploaded.');
	}
	if (!Object.keys(extensionByType).includes(file.type)) {
		throw new ValidationError(typeError);
	}
	if (file.size > maxBytes) {
		throw new ValidationError(`File must be ${Math.round(maxBytes / MB)}MB or smaller.`);
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const safeName = safeFileName(file, { base, extensionByType, extensionRe });
	const created = await adminStorage().createFile({
		bucketId,
		fileId: ID.unique(),
		file: InputFile.fromBuffer(buffer, safeName)
	});
	return { fileId: created.$id, url: fileViewUrl(created.$id, bucketId) };
}

export async function uploadProfilePhoto(file) {
	return uploadFile(file, {
		bucketId: PHOTO_BUCKET_ID,
		base: 'photo',
		maxBytes: PROFILE_PHOTO_MAX_BYTES
	});
}

export async function uploadSubmissionImage(file) {
	return uploadFile(file, {
		bucketId: SUBMISSION_IMAGE_BUCKET_ID,
		base: 'cover',
		maxBytes: SUBMISSION_IMAGE_MAX_BYTES
	});
}

/** Screenshot or screen recording attached to a feedback report. */
export async function uploadFeedbackAttachment(file) {
	return uploadFile(file, {
		bucketId: FEEDBACK_BUCKET_ID,
		base: 'attachment',
		maxBytes: FEEDBACK_ATTACHMENT_MAX_BYTES,
		extensionByType: { ...EXTENSION_BY_TYPE, ...VIDEO_EXTENSION_BY_TYPE },
		extensionRe: ATTACHMENT_EXTENSION_RE,
		typeError: 'Use an image (JPG, PNG, WEBP, AVIF, GIF) or a video (MP4, WEBM, MOV).'
	});
}

function safeFileName(file, { base, extensionByType, extensionRe }) {
	const extension = extensionByType[file.type] ?? 'jpg';
	const fallback = `${base}.${extension}`;
	const sanitized = String(file.name || fallback)
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.replace(/^_+/, '')
		.slice(0, 64);

	if (!sanitized) return fallback;
	if (extensionRe.test(sanitized)) return sanitized;

	const cut = sanitized.replace(/\.[^.]*$/, '').slice(0, 58) || base;
	return `${cut}.${extension}`;
}
