<script>
	import Seo from '$lib/components/Seo.svelte';
	import { formatDate } from '$lib/format.js';

	let { data } = $props();
	const user = $derived(data.user);

	// Filter state. Changing any of these re-queries page 1 server-side.
	let type = $state('');
	let tag = $state('');
	let author = $state('');
	let search = $state('');
	let sort = $state('newest');

	// Result state, seeded from the server-rendered first page.
	let items = $state(data.items);
	let total = $state(data.total);
	let cursor = $state(data.nextCursor);
	let loading = $state(false);
	let loadingMore = $state(false);
	let failed = $state(false);

	const hasLibrary = data.total > 0;
	const hasMore = $derived(!!cursor && items.length < total);

	// The index sets like a book: entries grouped under a chapter head per type.
	const chapters = $derived.by(() => {
		const out = [];
		const at = Object.create(null);
		for (const s of items) {
			const key = s.content_type_label ?? s.content_type ?? 'Other';
			if (at[key] === undefined) {
				at[key] = out.length;
				out.push({ label: key, list: [] });
			}
			out[at[key]].list.push(s);
		}
		return out;
	});

	// "Essay" → "Essays"; mass nouns keep their own name.
	const chapterHead = (label) => (label === 'Research' || label === 'Other' ? label : `${label}s`);

	function buildQuery(cursorParam) {
		const parts = [];
		const add = (k, v) => v && parts.push(`${k}=${encodeURIComponent(v)}`);
		add('type', type);
		add('tag', tag);
		add('author', author);
		add('search', search.trim());
		if (sort !== 'newest') add('sort', sort);
		add('cursor', cursorParam);
		return parts.join('&');
	}

	async function fetchPage(cursorParam) {
		const res = await fetch(`/api/submissions?${buildQuery(cursorParam)}`);
		if (!res.ok) throw new Error('Failed to load writing.');
		return res.json();
	}

	// Guards against out-of-order responses when filters change quickly.
	let reqSeq = 0;

	async function applyFilters() {
		const seq = ++reqSeq;
		loading = true;
		failed = false;
		try {
			const r = await fetchPage('');
			if (seq !== reqSeq) return;
			items = r.items;
			total = r.total;
			cursor = r.nextCursor;
		} catch {
			if (seq === reqSeq) failed = true;
		} finally {
			if (seq === reqSeq) loading = false;
		}
	}

	async function loadMore() {
		if (!cursor) return;
		const seq = reqSeq;
		loadingMore = true;
		try {
			const r = await fetchPage(cursor);
			if (seq !== reqSeq) return; // a filter change superseded this
			items = [...items, ...r.items];
			total = r.total;
			cursor = r.nextCursor;
		} catch {
			failed = true;
		} finally {
			loadingMore = false;
		}
	}

	let searchTimer;
	function onSearchInput() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(applyFilters, 300);
	}
</script>

<Seo
	title="Writings from the community"
	description="Read blogs, essays, excerpts, newsletters and research shared by members of The Writers' Room BLR."
/>

<section class="section">
	<div class="container">
		<div class="folio">
			<span>The Writers&rsquo; Room BLR</span>
			<span class="folio-mid">Index of published work</span>
			<span>Page W1</span>
		</div>

		<header class="page-head">
			<p class="eyebrow">From the room</p>
			<h1>Writings from the community</h1>
			<p class="lead">Pieces shared and approved by members, indexed by kind.</p>
		</header>

		<div class="adbox-double deskad">
			<div>
				<b>The composing desk is open</b>
				<span>
					{user
						? 'Add your blog, essay, excerpt or newsletter to the community library.'
						: 'Sign in to share your blog, essay, excerpt or newsletter with the community.'}
				</span>
			</div>
			<a class="btn btn-primary" href="/submit">{user ? 'Start writing' : 'Sign in to write'}</a>
		</div>

		{#if hasLibrary}
			<div class="controls">
				<div class="ctl grow">
					<label for="w-search">Search the index</label>
					<input
						type="search"
						id="w-search"
						placeholder="Titles, summaries, authors, tags…"
						bind:value={search}
						oninput={onSearchInput}
					/>
				</div>
				{#if data.facets.types.length}
					<div class="ctl">
						<label for="w-type">Type</label>
						<select id="w-type" bind:value={type} onchange={applyFilters} disabled={loading}>
							<option value="">All types</option>
							{#each data.facets.types as t (t.key)}
								<option value={t.key}>{t.label}</option>
							{/each}
						</select>
					</div>
				{/if}
				{#if data.facets.tags.length}
					<div class="ctl">
						<label for="w-tag">Tag</label>
						<select id="w-tag" bind:value={tag} onchange={applyFilters} disabled={loading}>
							<option value="">All tags</option>
							{#each data.facets.tags as tg (tg)}
								<option value={tg}>{tg}</option>
							{/each}
						</select>
					</div>
				{/if}
				{#if data.facets.authors.length}
					<div class="ctl">
						<label for="w-author">Author</label>
						<select id="w-author" bind:value={author} onchange={applyFilters} disabled={loading}>
							<option value="">All authors</option>
							{#each data.facets.authors as a (a.id)}
								<option value={a.id}>{a.name}</option>
							{/each}
						</select>
					</div>
				{/if}
				<div class="ctl">
					<label for="w-sort">Order</label>
					<select id="w-sort" bind:value={sort} onchange={applyFilters} disabled={loading}>
						<option value="newest">Newest first</option>
						<option value="oldest">Oldest first</option>
						<option value="title">Title A–Z</option>
					</select>
				</div>
			</div>

			{#if failed}
				<div class="tolet">
					<div class="tolet-head">Presses jammed</div>
					<p>Couldn't load writing. Change a filter to try again.</p>
				</div>
			{:else if items.length}
				<p class="result-count">{total} piece{total === 1 ? '' : 's'} on record</p>
				<div class="index" class:busy={loading} aria-busy={loading}>
					{#each chapters as ch (ch.label)}
						<section class="chapter">
							<h2>{chapterHead(ch.label)}</h2>
							<ul class="ix">
								{#each ch.list as s (s.id)}
									<li>
										<a class="ixrow" href={`/writing/${s.id}`}>
											<span class="t">{s.title}</span>
											{#if s.status === 'featured'}<span class="star" title="Featured">★</span>{/if}
											{#if s.author}<span class="by">{s.author.display_name ?? s.author}</span>{/if}
											<span class="leader"></span>
											<span class="dt">{formatDate(s.created_at)}</span>
										</a>
										{#if s.summary}<p class="sum">{s.summary}</p>{/if}
									</li>
								{/each}
							</ul>
						</section>
					{/each}
				</div>
				{#if hasMore}
					<div class="load-more">
						<button class="btn btn-secondary" onclick={loadMore} disabled={loadingMore}>
							{loadingMore ? 'Loading…' : 'Load more entries'}
						</button>
					</div>
				{/if}
			{:else if loading}
				<p class="result-count">Setting the index…</p>
			{:else}
				<div class="tolet">
					<div class="tolet-head">No entries under this heading</div>
					<p>Try different filters or clear them.</p>
				</div>
			{/if}
		{:else}
			<div class="tolet">
				<div class="tolet-head">This index awaits its first entry</div>
				<p>Approved writing will appear here. Be the first to share a piece.</p>
				<p style="margin-top:.9rem"><a class="btn btn-primary" href="/submit">Submit writing</a></p>
			</div>
		{/if}
	</div>
</section>

<style>
	.folio {
		margin-bottom: 1.2rem;
	}
	.page-head {
		max-width: 640px;
		margin-bottom: 1.2rem;
	}
	.page-head h1 {
		margin-bottom: 0.3rem;
	}
	.deskad {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: space-between;
		flex-wrap: wrap;
		padding: 0.85rem 1.1rem;
		margin-bottom: 1.4rem;
	}
	.deskad b {
		display: block;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: 0.85rem;
	}
	.deskad span {
		font-style: italic;
		color: var(--muted);
		font-size: 0.9rem;
	}
	.controls {
		display: flex;
		gap: 1.2rem;
		align-items: flex-end;
		flex-wrap: wrap;
		border-bottom: 2px solid var(--rule);
		padding-bottom: 0.8rem;
	}
	.ctl {
		flex: 1;
		min-width: 8.5rem;
	}
	.ctl.grow {
		flex: 2.4;
		min-width: 14rem;
	}
	.ctl label {
		font-size: 0.64rem;
		margin-bottom: 0.2rem;
	}
	.result-count {
		font-size: 0.82rem;
		font-style: italic;
		color: var(--muted);
		margin: 0.6rem 0 1.1rem;
	}
	.index {
		transition: opacity 0.15s ease;
	}
	.index.busy {
		opacity: 0.5;
		pointer-events: none;
	}
	.chapter {
		margin-bottom: 1.5rem;
	}
	.chapter h2 {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		margin: 0 0 0.1rem;
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}
	.chapter h2::after {
		content: '';
		flex: 1;
		border-top: 3px double var(--rule);
	}
	.ix {
		margin: 0;
		padding: 0;
		list-style: none;
		columns: 2;
		column-gap: 2.4rem;
		column-rule: 1px solid var(--hairline);
	}
	.ix li {
		break-inside: avoid;
	}
	.ixrow {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.42rem 0;
		color: inherit;
		text-decoration: none;
		border-bottom: 1px dotted var(--hairline);
	}
	.ixrow:hover .t {
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.t {
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.star {
		font-size: 0.8rem;
	}
	.by {
		font-variant: small-caps;
		letter-spacing: 0.04em;
		color: var(--ink-soft);
		font-size: 0.88rem;
		white-space: nowrap;
		max-width: 12rem;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.dt {
		color: var(--muted);
		font-size: 0.82rem;
		white-space: nowrap;
	}
	.sum {
		font-size: 0.82rem;
		font-style: italic;
		color: var(--muted);
		margin: 0.1rem 0 0.3rem;
		padding-right: 1rem;
	}
	.load-more {
		display: flex;
		justify-content: center;
		margin-top: 1.4rem;
	}
	.tolet {
		max-width: 42rem;
	}
	@media (max-width: 760px) {
		.ix {
			columns: 1;
		}
		.folio-mid {
			display: none;
		}
	}
</style>
