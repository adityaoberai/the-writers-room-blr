/**
 * Shared, framework-agnostic constants: database/table identifiers and the
 * enumerations used across the data model. Imported by both the SvelteKit app
 * (via `$lib/constants`) and the standalone provisioning script.
 */

export const DATABASE_ID = 'main';
export const PHOTO_BUCKET_ID = 'profile_photos';

export const TABLES = {
	users: 'users',
	profiles: 'profiles',
	directory: 'member_directory_entries',
	submissions: 'writing_submissions',
	events: 'events',
	rewardsRules: 'rewards_rules',
	activityLogs: 'activity_logs',
	badges: 'badges',
	userBadges: 'user_badges',
	siteSettings: 'site_settings'
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

export const REWARD_ACTIONS = [
	'attendance',
	'submission',
	'profile_completion',
	'referral',
	'prompt_participation'
];

export const ACTIVITY_SOURCE_TYPES = ['event', 'submission', 'profile', 'referral', 'prompt'];

export const BADGE_CRITERIA = ['points', 'submissions', 'attendance', 'profile_completion'];

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

export const REWARD_ACTION_LABELS = {
	attendance: 'Attending an event',
	submission: 'Submitting writing',
	profile_completion: 'Completing your profile',
	referral: 'Referring a member',
	prompt_participation: 'Joining a community prompt'
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
