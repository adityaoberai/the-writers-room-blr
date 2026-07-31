/**
 * Idempotent provisioning for The Writers' Room BLR.
 *
 * Creates the database, tables, columns and indexes described in the spec data
 * model, the profile-photo storage bucket, and seeds reward rules, badges,
 * site copy. Safe to run repeatedly; existing
 * resources (HTTP 409) are skipped.
 *
 * Run with:  node --env-file=.env scripts/provision.mjs
 */
import { Client, TablesDB, Storage, Permission, Role, Query, ID } from 'node-appwrite';
import {
	DATABASE_ID,
	PHOTO_BUCKET_ID,
	SUBMISSION_IMAGE_BUCKET_ID,
	FEEDBACK_BUCKET_ID,
	TABLES,
	ROLES,
	USER_STATUSES,
	CONTENT_TYPES,
	SUBMISSION_STATUSES,
	EVENT_SOURCES,
	REWARD_ACTIONS,
	ACTIVITY_SOURCE_TYPES,
	BADGE_CRITERIA,
	FEEDBACK_CATEGORIES,
	FEEDBACK_STATUSES
} from '../src/lib/constants.js';

const endpoint = process.env.APPWRITE_ENDPOINT;
const project = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !project || !apiKey) {
	console.error('Missing APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY.');
	console.error('Run with: node --env-file=.env scripts/provision.mjs');
	process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const tablesDB = new TablesDB(client);
const storage = new Storage(client);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run an async creation, swallowing "already exists" (409) so the script is idempotent. */
async function ensure(label, fn) {
	try {
		await fn();
		console.log(`  ✓ created ${label}`);
	} catch (err) {
		if (err?.code === 409) {
			console.log(`  • exists  ${label}`);
		} else {
			console.error(`  ✗ failed  ${label}: ${err?.message || err}`);
			throw err;
		}
	}
}

/**
 * Schema definition. Each column declares a type that maps to a typed
 * node-appwrite column creator. Required columns never carry a default
 * (Appwrite rejects that combination), and arrays never carry a default.
 */
const SCHEMA = [
	{
		id: TABLES.users,
		name: 'Users',
		columns: [
			{ key: 'email', type: 'email', required: true },
			{ key: 'role', type: 'enum', elements: ROLES, default: 'member' },
			{ key: 'status', type: 'enum', elements: USER_STATUSES, default: 'active' },
			{ key: 'last_login_at', type: 'datetime' }
		],
		indexes: [
			{ key: 'idx_email', type: 'unique', columns: ['email'] },
			{ key: 'idx_role', type: 'key', columns: ['role'] }
		]
	},
	{
		id: TABLES.profiles,
		name: 'Profiles',
		columns: [
			{ key: 'user_id', type: 'varchar', size: 64, required: true },
			{ key: 'display_name', type: 'varchar', size: 128, required: true },
			{ key: 'photo_url', type: 'varchar', size: 2048 },
			{ key: 'bio', type: 'text' },
			{ key: 'genres', type: 'varchar', size: 64, array: true },
			{ key: 'links', type: 'text' },
			{ key: 'location', type: 'varchar', size: 128, default: 'Bengaluru' },
			{ key: 'is_public', type: 'boolean', default: true },
			{ key: 'is_featured', type: 'boolean', default: false },
			{ key: 'listed', type: 'boolean', default: true }
		],
		indexes: [
			{ key: 'idx_user', type: 'unique', columns: ['user_id'] },
			{ key: 'idx_public', type: 'key', columns: ['is_public'] },
			{ key: 'idx_featured', type: 'key', columns: ['is_featured'] },
			{ key: 'idx_name_search', type: 'fulltext', columns: ['display_name'] }
		]
	},
	{
		id: TABLES.directory,
		name: 'Member Directory Entries',
		columns: [
			{ key: 'profile_id', type: 'varchar', size: 64, required: true },
			{ key: 'approved_by', type: 'varchar', size: 64 },
			{ key: 'approved_at', type: 'datetime' },
			{ key: 'directory_tags', type: 'varchar', size: 64, array: true }
		],
		indexes: [{ key: 'idx_profile', type: 'unique', columns: ['profile_id'] }]
	},
	{
		id: TABLES.submissions,
		name: 'Writing Submissions',
		columns: [
			{ key: 'user_id', type: 'varchar', size: 64, required: true },
			{ key: 'title', type: 'varchar', size: 256, required: true },
			{ key: 'summary', type: 'varchar', size: 1024 },
			{ key: 'content_type', type: 'enum', elements: CONTENT_TYPES, default: 'blog' },
			{ key: 'status', type: 'enum', elements: SUBMISSION_STATUSES },
			{ key: 'tags', type: 'varchar', size: 64, array: true },
			{ key: 'moderated_by', type: 'varchar', size: 64 },
			{ key: 'moderated_at', type: 'datetime' },
			{ key: 'image_url', type: 'varchar', size: 2048 },
			// Combined, full-text-indexed haystack (title + summary + tags + author name).
			{ key: 'search_text', type: 'longtext' },
			{ key: 'external_url', type: 'url' }
		],
		indexes: [
			{ key: 'idx_user', type: 'key', columns: ['user_id'] },
			{ key: 'idx_status', type: 'key', columns: ['status'] },
			{ key: 'idx_type', type: 'key', columns: ['content_type'] },
			{ key: 'idx_title_search', type: 'fulltext', columns: ['title'] },
			{ key: 'idx_title_unique', type: 'unique', columns: ['title'] },
			{ key: 'idx_search', type: 'fulltext', columns: ['search_text'] }
		]
	},
	{
		id: TABLES.events,
		name: 'Events',
		columns: [
			{ key: 'title', type: 'varchar', size: 256, required: true },
			{ key: 'start_at', type: 'datetime' },
			{ key: 'end_at', type: 'datetime' },
			{ key: 'location', type: 'varchar', size: 256 },
			{ key: 'description', type: 'text' },
			{ key: 'source', type: 'enum', elements: EVENT_SOURCES, default: 'manual' },
			{ key: 'external_url', type: 'url' }
		],
		indexes: [{ key: 'idx_start', type: 'key', columns: ['start_at'] }]
	},
	{
		id: TABLES.rewardsRules,
		name: 'Rewards Rules',
		columns: [
			{ key: 'action_key', type: 'enum', elements: REWARD_ACTIONS, required: true },
			{ key: 'points', type: 'integer', min: 0, default: 0 },
			{ key: 'is_active', type: 'boolean', default: true }
		],
		indexes: [{ key: 'idx_action', type: 'unique', columns: ['action_key'] }]
	},
	{
		id: TABLES.activityLogs,
		name: 'Activity Logs',
		columns: [
			{ key: 'user_id', type: 'varchar', size: 64, required: true },
			{ key: 'reward_rule_id', type: 'varchar', size: 64 },
			{ key: 'points_awarded', type: 'integer', default: 0 },
			{ key: 'source_type', type: 'enum', elements: ACTIVITY_SOURCE_TYPES, default: 'submission' },
			{ key: 'source_id', type: 'varchar', size: 64 },
			{ key: 'notes', type: 'varchar', size: 1024 }
		],
		indexes: [
			{ key: 'idx_user', type: 'key', columns: ['user_id'] },
			{ key: 'idx_dedupe', type: 'unique', columns: ['user_id', 'source_type', 'source_id'] }
		]
	},
	{
		id: TABLES.badges,
		name: 'Badges',
		columns: [
			{ key: 'name', type: 'varchar', size: 128, required: true },
			{ key: 'description', type: 'varchar', size: 512 },
			{ key: 'icon', type: 'varchar', size: 64 },
			{ key: 'criteria_type', type: 'enum', elements: BADGE_CRITERIA, default: 'points' },
			{ key: 'criteria_value', type: 'integer', min: 0, default: 0 },
			{ key: 'is_active', type: 'boolean', default: true }
		],
		indexes: [{ key: 'idx_criteria', type: 'key', columns: ['criteria_type'] }]
	},
	{
		id: TABLES.userBadges,
		name: 'User Badges',
		columns: [
			{ key: 'user_id', type: 'varchar', size: 64, required: true },
			{ key: 'badge_id', type: 'varchar', size: 64, required: true },
			{ key: 'earned_at', type: 'datetime' }
		],
		indexes: [
			{ key: 'idx_user', type: 'key', columns: ['user_id'] },
			{ key: 'idx_unique', type: 'unique', columns: ['user_id', 'badge_id'] }
		]
	},
	{
		id: TABLES.siteSettings,
		name: 'Site Settings',
		columns: [
			{ key: 'key', type: 'varchar', size: 128, required: true },
			{ key: 'value', type: 'mediumtext' }
		],
		indexes: [{ key: 'idx_key', type: 'unique', columns: ['key'] }]
	},
	{
		id: TABLES.feedback,
		name: 'Feedback',
		columns: [
			{ key: 'user_id', type: 'varchar', size: 64, required: true },
			{ key: 'email', type: 'email' },
			{ key: 'category', type: 'enum', elements: FEEDBACK_CATEGORIES, default: 'other' },
			{ key: 'message', type: 'text', required: true },
			{ key: 'page', type: 'varchar', size: 256 },
			{ key: 'attachment_url', type: 'varchar', size: 2048 },
			{ key: 'status', type: 'enum', elements: FEEDBACK_STATUSES, default: 'new' },
			{ key: 'reviewed_by', type: 'varchar', size: 64 },
			{ key: 'reviewed_at', type: 'datetime' }
		],
		indexes: [
			{ key: 'idx_user', type: 'key', columns: ['user_id'] },
			{ key: 'idx_status', type: 'key', columns: ['status'] }
		]
	}
];

function createColumn(databaseId, tableId, c) {
	const base = { databaseId, tableId, key: c.key, required: !!c.required };
	// Defaults are only valid on optional, non-array columns.
	const canDefault = !c.required && !c.array && c.default !== undefined;
	switch (c.type) {
		case 'varchar':
			return tablesDB.createVarcharColumn({
				...base,
				size: c.size,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		case 'text':
			return tablesDB.createTextColumn({
				...base,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		case 'mediumtext':
			return tablesDB.createMediumtextColumn({
				...base,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		case 'longtext':
			return tablesDB.createLongtextColumn({
				...base,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		case 'boolean':
			return tablesDB.createBooleanColumn({
				...base,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		case 'integer':
			return tablesDB.createIntegerColumn({
				...base,
				array: !!c.array,
				...(c.min !== undefined ? { min: c.min } : {}),
				...(c.max !== undefined ? { max: c.max } : {}),
				...(canDefault ? { default: c.default } : {})
			});
		case 'datetime':
			return tablesDB.createDatetimeColumn({
				...base,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		case 'email':
			return tablesDB.createEmailColumn({
				...base,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		case 'url':
			return tablesDB.createUrlColumn({
				...base,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		case 'enum':
			return tablesDB.createEnumColumn({
				...base,
				elements: c.elements,
				array: !!c.array,
				...(canDefault ? { default: c.default } : {})
			});
		default:
			throw new Error(`Unknown column type: ${c.type}`);
	}
}

/** Poll until every column on a table reports `available`, so indexes can be created. */
async function waitForColumns(databaseId, tableId) {
	for (let attempt = 0; attempt < 40; attempt++) {
		const { columns } = await tablesDB.listColumns({ databaseId, tableId });
		const pending = columns.filter((c) => c.status !== 'available');
		if (pending.length === 0) return;
		const failed = pending.filter((c) => c.status === 'failed');
		if (failed.length) {
			console.warn(`    ! columns failed on ${tableId}: ${failed.map((c) => c.key).join(', ')}`);
		}
		await sleep(1000);
	}
	console.warn(`    ! timed out waiting for columns on ${tableId}`);
}

const INDEX_TYPE = { key: 'key', unique: 'unique', fulltext: 'fulltext' };

async function provisionDatabase() {
	console.log(`Database "${DATABASE_ID}"`);
	await ensure(`database ${DATABASE_ID}`, () =>
		tablesDB.create({ databaseId: DATABASE_ID, name: "The Writers' Room" })
	);

	for (const table of SCHEMA) {
		console.log(`Table "${table.id}"`);
		await ensure(`table ${table.id}`, () =>
			tablesDB.createTable({
				databaseId: DATABASE_ID,
				tableId: table.id,
				name: table.name,
				rowSecurity: false,
				permissions: []
			})
		);
		for (const column of table.columns) {
			await ensure(`column ${table.id}.${column.key}`, () =>
				createColumn(DATABASE_ID, table.id, column)
			);
		}
		await waitForColumns(DATABASE_ID, table.id);
		for (const index of table.indexes) {
			await ensure(`index ${table.id}.${index.key}`, () =>
				tablesDB.createIndex({
					databaseId: DATABASE_ID,
					tableId: table.id,
					key: index.key,
					type: INDEX_TYPE[index.type],
					columns: index.columns
				})
			);
		}
	}
}

const BUCKETS = [
	{ id: PHOTO_BUCKET_ID, name: 'Profile Photos' },
	{ id: SUBMISSION_IMAGE_BUCKET_ID, name: 'Submission Images' },
	{ id: FEEDBACK_BUCKET_ID, name: 'Feedback Uploads' }
];

async function provisionBuckets() {
	for (const bucket of BUCKETS) {
		console.log(`Bucket "${bucket.id}"`);
		await ensure(`bucket ${bucket.id}`, () =>
			storage.createBucket({
				bucketId: bucket.id,
				name: bucket.name,
				permissions: [Permission.read(Role.any())],
				fileSecurity: false,
				enabled: true,
				maximumFileSize: 100 * 1024 * 1024
			})
		);
	}
}

async function seedRow(tableId, rowId, data) {
	await ensure(`seed ${tableId}/${rowId}`, () =>
		tablesDB.createRow({ databaseId: DATABASE_ID, tableId, rowId, data })
	);
}

/** Delete a row if it exists, swallowing 404 so cleanup is idempotent. */
async function removeRow(tableId, rowId) {
	try {
		await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId, rowId });
		console.log(`  ✓ removed ${tableId}/${rowId}`);
	} catch (err) {
		if (err?.code === 404) {
			console.log(`  • absent  ${tableId}/${rowId}`);
		} else {
			console.error(`  ✗ failed  remove ${tableId}/${rowId}: ${err?.message || err}`);
			throw err;
		}
	}
}

/**
 * Bring enum columns in line with the current constants. Appwrite keeps the
 * element list from when a column was created, so retired values are dropped
 * (cleanupLegacySeeds deletes their rows first) and newly added badge
 * criteria become valid before seeding.
 */
async function syncEnumColumns() {
	console.log('Syncing enum columns with current constants');
	const enums = [
		{ tableId: TABLES.rewardsRules, key: 'action_key', elements: REWARD_ACTIONS, required: true },
		{
			tableId: TABLES.activityLogs,
			key: 'source_type',
			elements: ACTIVITY_SOURCE_TYPES,
			required: false,
			xdefault: 'submission'
		},
		{
			tableId: TABLES.badges,
			key: 'criteria_type',
			elements: BADGE_CRITERIA,
			required: false,
			xdefault: 'points'
		}
	];
	for (const e of enums) {
		try {
			// The SDK requires xdefault to be passed explicitly; null for required columns.
			await tablesDB.updateEnumColumn({
				databaseId: DATABASE_ID,
				tableId: e.tableId,
				key: e.key,
				elements: e.elements,
				required: e.required,
				xdefault: e.xdefault ?? null
			});
			console.log(`  ✓ synced  ${e.tableId}.${e.key}`);
		} catch (err) {
			console.error(`  ✗ failed  ${e.tableId}.${e.key}: ${err?.message || err}`);
			throw err;
		}
	}
	// Column updates settle asynchronously; give them a moment before seeding.
	await sleep(1500);
}

/**
 * Remove seeds from earlier versions that no longer apply: the site never
 * takes event registrations and has no referral or prompt mechanics, so
 * those reward rules (and the attendance badge) are unearnable. The
 * "Fully Introduced" badge was merged into "Newcomer" (completing your
 * profile awards 20 points, which is exactly the Newcomer threshold).
 */
async function cleanupLegacySeeds() {
	console.log('Removing retired reward rules and badges');
	for (const key of ['attendance', 'referral', 'prompt_participation']) {
		await removeRow(TABLES.rewardsRules, `rule_${key}`);
	}
	const retiredBadges = ['badge_regular_attendee', 'badge_profile_complete'];
	for (const id of retiredBadges) {
		await removeRow(TABLES.badges, id);
	}

	// Drop earned rows pointing at retired badges so badge counts stay honest.
	for (let i = 0; i < 100; i++) {
		const res = await tablesDB.listRows({
			databaseId: DATABASE_ID,
			tableId: TABLES.userBadges,
			queries: [Query.equal('badge_id', retiredBadges), Query.limit(100)]
		});
		const rows = res.rows ?? res.documents ?? [];
		if (!rows.length) break;
		for (const row of rows) {
			await removeRow(TABLES.userBadges, row.$id);
		}
		if (rows.length < 100) break;
	}
}

async function seedData() {
	console.log('Seeding reward rules, badges, site copy and sample events');

	const rules = [
		{ action_key: 'submission', points: 30 },
		{ action_key: 'profile_completion', points: 20 }
	];
	for (const r of rules) {
		await seedRow(TABLES.rewardsRules, `rule_${r.action_key}`, { ...r, is_active: true });
	}

	const badges = [
		{
			id: 'first_words',
			name: 'First Words',
			icon: 'feather',
			criteria_type: 'submissions',
			criteria_value: 1,
			description: 'Shared your first piece of writing.'
		},
		{
			id: 'storyteller',
			name: 'Storyteller',
			icon: 'book',
			criteria_type: 'submissions',
			criteria_value: 5,
			description: 'Published five pieces with the community.'
		},
		{
			id: 'prolific_pen',
			name: 'Prolific Pen',
			icon: 'sparkles',
			criteria_type: 'submissions',
			criteria_value: 10,
			description: 'Ten pieces and counting.'
		},
		{
			id: 'newcomer',
			name: 'Newcomer',
			icon: 'seedling',
			criteria_type: 'points',
			criteria_value: 20,
			description: 'Earned your first 20 points.'
		},
		{
			id: 'regular',
			name: 'Regular',
			icon: 'star',
			criteria_type: 'points',
			criteria_value: 100,
			description: 'Reached 100 community points.'
		},
		{
			id: 'pillar',
			name: 'Community Pillar',
			icon: 'crown',
			criteria_type: 'points',
			criteria_value: 300,
			description: 'A cornerstone of the room, at 300 points.'
		},
		{
			id: 'front_page',
			name: 'Front Page',
			icon: 'laurel',
			criteria_type: 'featured',
			criteria_value: 1,
			description: 'Had a piece featured by the room.'
		},
		{
			id: 'range',
			name: 'Range',
			icon: 'palette',
			criteria_type: 'content_types',
			criteria_value: 3,
			description: 'Shared work in three different formats.'
		},
		{
			id: 'steady_pen',
			name: 'Steady Pen',
			icon: 'quill',
			criteria_type: 'active_months',
			criteria_value: 3,
			description: 'Shared writing in three different months.'
		}
	];
	for (const b of badges) {
		const { id, ...data } = b;
		await seedRow(TABLES.badges, `badge_${id}`, { ...data, is_active: true });
	}

	const benefits = JSON.stringify([
		{
			title: 'Focused writing sessions',
			body: 'Phones down, timers on. Three hours of distraction-free writing with fellow writers.',
			icon: 'pen'
		},
		{
			title: 'Work first, network second',
			body: 'The session is for quiet writing on your own; introductions wait for the show-and-tell.',
			icon: 'pen'
		},
		{
			title: 'A real community',
			body: 'Meet writers across genres: fiction, essays, newsletters and research.',
			icon: 'people'
		},
		{
			title: 'Share your work',
			body: 'Publish blogs, essays and excerpts to a directory of people who actually read.',
			icon: 'book'
		}
	]);

	const settings = [
		{ key: 'hero_title', value: "Where Bengaluru's writers gather." },
		{
			key: 'hero_subtitle',
			value:
				'For the novel in your drawer, the newsletter you keep postponing, the essay that needs one more pass.'
		},
		{
			key: 'mission',
			value:
				'The Writers’ Room BLR is a calm, focused space for writers in Bengaluru. We meet for quiet co-working, each of us carrying our own writing tools, to write together, share work, and build the kind of steady community that makes the writing life less lonely.'
		},
		{ key: 'luma_url', value: 'https://luma.com/the-writers-room' },
		{ key: 'benefits', value: benefits }
	];
	for (const s of settings) {
		await seedRow(TABLES.siteSettings, `setting_${s.key}`, s);
	}

	// Events are not seeded; upcoming and past meetups are driven entirely by the
	// events table, managed by admins from the dashboard.
}

/**
 * One-time data migration for the "listed/approved by default" change.
 * Existing never-reviewed submissions (`pending`) become public (`approved`);
 * `rejected` rows are left hidden so past reject decisions are preserved.
 * Profiles are backfilled to listed by the `listed` column default.
 */
async function migrateContent() {
	console.log('Migrating existing content');
	let migrated = 0;
	for (let i = 0; i < 100; i++) {
		const res = await tablesDB.listRows({
			databaseId: DATABASE_ID,
			tableId: TABLES.submissions,
			queries: [Query.equal('status', 'pending'), Query.limit(100)]
		});
		const rows = res.rows ?? res.documents ?? [];
		if (!rows.length) break;
		for (const row of rows) {
			await tablesDB.updateRow({
				databaseId: DATABASE_ID,
				tableId: TABLES.submissions,
				rowId: row.$id,
				data: { status: 'approved' }
			});
			migrated++;
		}
		if (rows.length < 100) break;
	}
	console.log(`  ✓ ${migrated} pending submission(s) set to approved`);

	await backfillSearchText();
}

/** Fetch every row of a table (minimal fields), paging past the 100-row ceiling. */
async function scanAll(tableId, select) {
	const out = [];
	let cursor = null;
	for (let i = 0; i < 200; i++) {
		const queries = [Query.limit(100)];
		if (select) queries.push(Query.select(select));
		if (cursor) queries.push(Query.cursorAfter(cursor));
		const res = await tablesDB.listRows({ databaseId: DATABASE_ID, tableId, queries });
		const rows = res.rows ?? res.documents ?? [];
		out.push(...rows);
		if (rows.length < 100) break;
		cursor = rows[rows.length - 1].$id;
	}
	return out;
}

/** Populate `search_text` (title + summary + tags + author name) on rows missing it. */
async function backfillSearchText() {
	const profiles = await scanAll(TABLES.profiles, ['user_id', 'display_name']);
	const nameByUser = Object.fromEntries(profiles.map((p) => [p.user_id, p.display_name ?? '']));
	const rows = await scanAll(TABLES.submissions);

	let backfilled = 0;
	for (const r of rows) {
		const text = [r.title, r.summary, ...(r.tags ?? []), nameByUser[r.user_id]]
			.filter(Boolean)
			.join(' ')
			.slice(0, 8000);
		if ((r.search_text ?? '') === text) continue;
		await tablesDB.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLES.submissions,
			rowId: r.$id,
			data: { search_text: text }
		});
		backfilled++;
	}
	console.log(`  ✓ backfilled search_text on ${backfilled} submission(s)`);
}

/** Mirror of the app's isProfileComplete. */
function profileComplete(profile) {
	if (!profile) return false;
	return (
		!!profile.display_name && (profile.bio ?? '').trim().length > 0 && (profile.genres ?? []).length >= 1
	);
}

/**
 * Recompute awards for every member from raw data, mirroring the app's
 * recomputeBadges. The app only grants at the moment a reward event or
 * moderation fires, so awards introduced by new badge definitions, by
 * moderation that happened before the app deploy, or lost to an interrupted
 * save (the profile-completion award) need this catch-up pass.
 */
async function backfillAwards() {
	console.log('Backfilling profile awards and badges');
	const badges = (await scanAll(TABLES.badges)).filter((b) => b.is_active);
	const earned = await scanAll(TABLES.userBadges);
	const logs = await scanAll(TABLES.activityLogs);
	const subs = await scanAll(TABLES.submissions);
	const profiles = await scanAll(TABLES.profiles);
	const rules = await scanAll(TABLES.rewardsRules);
	const profileRule = rules.find((r) => r.$id === 'rule_profile_completion');

	const earnedSet = new Set(earned.map((r) => `${r.user_id}:${r.badge_id}`));
	const profileByUser = new Map(profiles.map((p) => [p.user_id, p]));
	const users = new Set([
		...logs.map((l) => l.user_id),
		...subs.map((s) => s.user_id),
		...profiles.map((p) => p.user_id)
	]);

	let granted = 0;
	for (const userId of users) {
		const mine = subs.filter((s) => s.user_id === userId);
		const visible = mine.filter((s) => s.status !== 'rejected');
		const profile = profileByUser.get(userId);
		// Match the app: awards only count while their source still stands.
		const visibleIds = new Set(visible.map((s) => s.$id));
		const liveLogs = logs
			.filter((l) => l.user_id === userId)
			.filter((l) => {
				if (l.source_type === 'submission') return visibleIds.has(l.source_id);
				if (l.source_type === 'profile') return profile?.$id === l.source_id;
				return true;
			});

		// Missing profile-completion award: the app grants it on profile save,
		// which can be lost when the runtime ends before the write finishes.
		let profilePoints = 0;
		if (
			profileComplete(profile) &&
			profileRule?.is_active &&
			(profileRule.points ?? 0) > 0 &&
			!liveLogs.some((l) => l.source_type === 'profile')
		) {
			await ensure(`award profile completion -> ${userId}`, () =>
				tablesDB.createRow({
					databaseId: DATABASE_ID,
					tableId: TABLES.activityLogs,
					rowId: ID.unique(),
					data: {
						user_id: userId,
						reward_rule_id: profileRule.$id,
						points_awarded: profileRule.points,
						source_type: 'profile',
						source_id: profile.$id,
						notes: 'Completed profile'
					}
				})
			);
			profilePoints = profileRule.points;
			granted++;
		}

		const metrics = {
			points: profilePoints + liveLogs.reduce((t, l) => t + (l.points_awarded ?? 0), 0),
			submissions: visible.length,
			featured: mine.filter((s) => s.status === 'featured').length,
			content_types: new Set(visible.map((s) => s.content_type).filter(Boolean)).size,
			active_months: new Set(visible.map((s) => (s.$createdAt ?? '').slice(0, 7)).filter(Boolean))
				.size
		};
		for (const badge of badges) {
			if (earnedSet.has(`${userId}:${badge.$id}`)) continue;
			if ((metrics[badge.criteria_type] ?? -1) < badge.criteria_value) continue;
			await ensure(`award ${badge.$id} -> ${userId}`, () =>
				tablesDB.createRow({
					databaseId: DATABASE_ID,
					tableId: TABLES.userBadges,
					rowId: ID.unique(),
					data: { user_id: userId, badge_id: badge.$id, earned_at: new Date().toISOString() }
				})
			);
			granted++;
		}
	}
	console.log(`  ✓ ${granted} award(s) backfilled`);
}

async function main() {
	console.log(`Provisioning project "${project}" at ${endpoint}\n`);
	await provisionDatabase();
	await provisionBuckets();
	await cleanupLegacySeeds();
	await syncEnumColumns();
	await seedData();
	await backfillAwards();
	await migrateContent();
	console.log('\nDone. Schema, bucket and seed data are in place.');
}

main().catch((err) => {
	console.error('\nProvisioning failed:', err?.message || err);
	process.exit(1);
});
