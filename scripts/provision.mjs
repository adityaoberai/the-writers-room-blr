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
import { Client, TablesDB, Storage, Permission, Role } from 'node-appwrite';
import {
	DATABASE_ID,
	PHOTO_BUCKET_ID,
	TABLES,
	ROLES,
	USER_STATUSES,
	CONTENT_TYPES,
	SUBMISSION_STATUSES,
	EVENT_SOURCES,
	REWARD_ACTIONS,
	ACTIVITY_SOURCE_TYPES,
	BADGE_CRITERIA
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
			{ key: 'is_featured', type: 'boolean', default: false }
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
			{ key: 'body', type: 'mediumtext' },
			{ key: 'external_url', type: 'url' },
			{ key: 'status', type: 'enum', elements: SUBMISSION_STATUSES, default: 'pending' },
			{ key: 'tags', type: 'varchar', size: 64, array: true },
			{ key: 'moderated_by', type: 'varchar', size: 64 },
			{ key: 'moderated_at', type: 'datetime' }
		],
		indexes: [
			{ key: 'idx_user', type: 'key', columns: ['user_id'] },
			{ key: 'idx_status', type: 'key', columns: ['status'] },
			{ key: 'idx_type', type: 'key', columns: ['content_type'] },
			{ key: 'idx_title_search', type: 'fulltext', columns: ['title'] }
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

async function provisionBucket() {
	console.log(`Bucket "${PHOTO_BUCKET_ID}"`);
	await ensure(`bucket ${PHOTO_BUCKET_ID}`, () =>
		storage.createBucket({
			bucketId: PHOTO_BUCKET_ID,
			name: 'Profile Photos',
			permissions: [Permission.read(Role.any())],
			fileSecurity: false,
			enabled: true,
			maximumFileSize: 100 * 1024 * 1024
		})
	);
}

async function seedRow(tableId, rowId, data) {
	await ensure(`seed ${tableId}/${rowId}`, () =>
		tablesDB.createRow({ databaseId: DATABASE_ID, tableId, rowId, data })
	);
}

async function seedData() {
	console.log('Seeding reward rules, badges, site copy and sample events');

	const rules = [
		{ action_key: 'attendance', points: 50 },
		{ action_key: 'submission', points: 30 },
		{ action_key: 'profile_completion', points: 20 },
		{ action_key: 'referral', points: 40 },
		{ action_key: 'prompt_participation', points: 25 }
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
			id: 'profile_complete',
			name: 'Fully Introduced',
			icon: 'id',
			criteria_type: 'profile_completion',
			criteria_value: 1,
			description: 'Completed your member profile.'
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
			id: 'regular_attendee',
			name: 'Regular Attendee',
			icon: 'calendar',
			criteria_type: 'attendance',
			criteria_value: 3,
			description: 'Showed up to three meetups.'
		}
	];
	for (const b of badges) {
		const { id, ...data } = b;
		await seedRow(TABLES.badges, `badge_${id}`, { ...data, is_active: true });
	}

	const testimonials = JSON.stringify([
		{
			quote: 'I finally have a standing time to write, and people who get it.',
			name: 'Ananya R.',
			role: 'Essayist'
		},
		{
			quote: 'Two hours of focused, phone-down writing every week changed my output completely.',
			name: 'Karthik V.',
			role: 'Newsletter writer'
		},
		{
			quote: 'The feedback is gentle but honest. It is the most useful room in my week.',
			name: 'Meera S.',
			role: 'Long-form nonfiction'
		}
	]);
	const benefits = JSON.stringify([
		{
			title: 'Focused writing sessions',
			body: 'Phones down, timers on. Three hours of distraction-free writing with fellow writers.',
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
		},
		{
			title: 'Earn recognition',
			body: 'Points, badges and milestones for showing up and contributing.',
			icon: 'star'
		}
	]);

	const settings = [
		{ key: 'hero_title', value: "Where Bengaluru's writers gather." },
		{
			key: 'hero_subtitle',
			value:
				'A focused writing community to create, connect, and grow together, one quiet, phones-down session at a time.'
		},
		{
			key: 'mission',
			value:
				'The Writers’ Room is a calm, focused space for writers in Bengaluru. We meet to write together, share work, and build the kind of steady community that makes the writing life less lonely.'
		},
		{
			key: 'meetup_format',
			value:
				'The priority of this meetup is to create space for quiet co-working, so every accepted attendee must carry their writing tools. Introductions only happen during the show-and-tell.'
		},
		{
			key: 'meetup_note',
			value:
				"Please only apply if you're happy to spend the session quietly writing on your own. We keep introductions to the show-and-tell, so the focus stays on the work."
		},
		{
			key: 'readers_room',
			value: 'Same calm, phones-down format, but you bring a book and read instead of write.'
		},
		{ key: 'luma_url', value: 'https://luma.com/the-writers-room' },
		{
			key: 'luma_embed_url',
			value: 'https://luma.com/embed/calendar/cal-Ghb0PyZV9XUEJSL/events'
		},
		{ key: 'benefits', value: benefits },
		{ key: 'testimonials', value: testimonials }
	];
	for (const s of settings) {
		await seedRow(TABLES.siteSettings, `setting_${s.key}`, s);
	}

	// Events are not seeded; the public calendar is driven entirely by the Luma
	// embed (configured via the `luma_embed_url` site setting). The events table
	// remains for the optional admin-managed past-meetups archive.
}

async function main() {
	console.log(`Provisioning project "${project}" at ${endpoint}\n`);
	await provisionDatabase();
	await provisionBucket();
	await seedData();
	console.log('\nDone. Schema, bucket and seed data are in place.');
}

main().catch((err) => {
	console.error('\nProvisioning failed:', err?.message || err);
	process.exit(1);
});
