/**
 * Shared, framework-agnostic constants: database/table identifiers and the
 * enumerations used across the data model. Imported by both the SvelteKit app
 * (via `$lib/constants`) and the standalone provisioning script.
 */

export const DATABASE_ID = 'main';
export const PHOTO_BUCKET_ID = 'profile_photos';
export const SUBMISSION_IMAGE_BUCKET_ID = 'submission_images';
export const FEEDBACK_BUCKET_ID = 'feedback_uploads';

export const TABLES = {
	users: 'users',
	profiles: 'profiles',
	submissions: 'writing_submissions',
	events: 'events',
	rewardsRules: 'rewards_rules',
	activityLogs: 'activity_logs',
	badges: 'badges',
	userBadges: 'user_badges',
	siteSettings: 'site_settings',
	feedback: 'feedback'
};

export const ROLES = ['member', 'admin'];
export const USER_STATUSES = ['pending', 'active', 'suspended'];

export const CONTENT_TYPES = [
	'blog',
	'essay',
	'article',
	'excerpt',
	'newsletter',
	'research',
	'book',
	'other'
];
export const SUBMISSION_STATUSES = ['pending', 'approved', 'rejected', 'featured'];

export const EVENT_SOURCES = ['luma', 'manual'];

export const BADGE_CRITERIA = [
	'profile_completion',
	'submissions',
	'featured',
	'content_types',
	'active_months'
];

export const FEEDBACK_CATEGORIES = ['bug', 'idea', 'question', 'other'];
export const FEEDBACK_STATUSES = ['new', 'reviewed', 'resolved'];

/** Plain-language labels so non-technical members recognise their situation. */
export const FEEDBACK_CATEGORY_LABELS = {
	bug: 'Something looks broken',
	idea: 'An idea or suggestion',
	question: 'A question',
	other: 'Something else'
};

/** Human-friendly labels for content types, reused across the UI. */
export const CONTENT_TYPE_LABELS = {
	blog: 'Blog',
	essay: 'Essay',
	article: 'Article',
	excerpt: 'Excerpt',
	newsletter: 'Newsletter',
	research: 'Research',
	book: 'Book',
	other: 'Other'
};

/** A curated set of writing genres offered as suggestions during onboarding. */
export const GENRE_SUGGESTIONS = [
	'Fiction',
	'Literary Fiction',
	'Poetry',
	'Essays',
	'Memoir',
	'Long-form Nonfiction',
	'Journalism',
	'Newsletter',
	'Blogging',
	'Screenwriting',
	'Speculative Fiction',
	'Travel Writing',
	'Food Writing',
	'Technical Writing',
	'Copywriting',
	'Children’s Writing'
];
