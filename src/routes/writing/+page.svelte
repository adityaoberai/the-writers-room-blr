<script>
	import Seo from '$lib/components/Seo.svelte';
	import SubmissionCard from '$lib/components/SubmissionCard.svelte';

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
	title="Community writing"
	description="Read blogs, essays, excerpts, newsletters and research shared by members of The Writers' Room BLR."
/>

<section class="section">
	<div class="container">
		<header class="page-head">
			<p class="eyebrow">From the room</p>
			<h1>Community writing</h1>
			<p class="lead">Pieces shared and approved by members.</p>
		</header>

		<div class="start-band">
			<div>
				<h2>Start writing</h2>
				<p>
					{user
						? 'Add your blog, essay, excerpt or newsletter to the community library.'
						: 'Sign in to share your blog, essay, excerpt or newsletter with the community.'}
				</p>
			</div>
			<a class="btn btn-primary" href="/submit">{user ? 'Start writing' : 'Sign in to write'}</a>
		</div>

		{#if hasLibrary}
			<div class="controls">
				<div class="search">
					<input
						type="search"
						placeholder="Search titles, summaries, authors, tags…"
						bind:value={search}
						oninput={onSearchInput}
						aria-label="Search writing"
					/>
				</div>
				<div class="filters">
					{#if data.facets.types.length}
						<label>
							<span class="visually-hidden">Filter by type</span>
							<select bind:value={type} onchange={applyFilters} disabled={loading}>
								<option value="">All types</option>
								{#each data.facets.types as t (t.key)}
									<option value={t.key}>{t.label}</option>
								{/each}
							</select>
						</label>
					{/if}
					{#if data.facets.tags.length}
						<label>
							<span class="visually-hidden">Filter by tag</span>
							<select bind:value={tag} onchange={applyFilters} disabled={loading}>
								<option value="">All tags</option>
								{#each data.facets.tags as tg (tg)}
									<option value={tg}>{tg}</option>
								{/each}
							</select>
						</label>
					{/if}
					{#if data.facets.authors.length}
						<label>
							<span class="visually-hidden">Filter by author</span>
							<select bind:value={author} onchange={applyFilters} disabled={loading}>
								<option value="">All authors</option>
								{#each data.facets.authors as a (a.id)}
									<option value={a.id}>{a.name}</option>
								{/each}
							</select>
						</label>
					{/if}
					<label>
						<span class="visually-hidden">Sort pieces</span>
						<select bind:value={sort} onchange={applyFilters} disabled={loading}>
							<option value="newest">Newest first</option>
							<option value="oldest">Oldest first</option>
							<option value="title">Title A–Z</option>
						</select>
					</label>
				</div>
			</div>

			{#if failed}
				<div class="card center empty">
					<p class="muted">Couldn't load writing. Change a filter to try again.</p>
				</div>
			{:else if items.length}
				<p class="result-count muted">
					{total} piece{total === 1 ? '' : 's'}
				</p>
				<div class="writing-grid" class:busy={loading} aria-busy={loading}>
					{#each items as s (s.id)}
						<SubmissionCard submission={s} compact />
					{/each}
				</div>
				{#if hasMore}
					<div class="load-more">
						<button class="btn btn-secondary" onclick={loadMore} disabled={loadingMore}>
							{loadingMore ? 'Loading…' : 'Load more'}
						</button>
					</div>
				{/if}
			{:else if loading}
				<p class="result-count muted">Loading…</p>
			{:else}
				<div class="card center empty">
					<h3>No matches</h3>
					<p class="muted">Try different filters or clear them.</p>
				</div>
			{/if}
		{:else}
			<div class="card center empty">
				<h3>Nothing here yet</h3>
				<p class="muted">Approved writing will appear here. Be the first to share a piece.</p>
				<a class="btn btn-primary" href="/submit">Submit writing</a>
			</div>
		{/if}
	</div>
</section>

<style>
	.page-head {
		max-width: 640px;
		margin-bottom: 1.25rem;
	}
	.page-head h1 {
		margin-bottom: 0.4rem;
	}
	.start-band {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem;
		flex-wrap: wrap;
		background: #eaf1f9;
		border: 1px solid #cfe0f0;
		border-radius: var(--radius);
		padding: 1.1rem 1.4rem;
		margin-bottom: 1.5rem;
	}
	.start-band h2 {
		margin: 0 0 0.2rem;
		font-size: 1.25rem;
	}
	.start-band p {
		margin: 0;
		color: var(--muted);
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.1rem;
	}
	.controls .search {
		flex: 1 1 320px;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.filters label {
		margin: 0;
	}
	.filters select {
		width: auto;
	}
	.result-count {
		margin: 0 0 1rem;
		font-size: 0.9rem;
	}
	.writing-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		transition: opacity 0.15s ease;
	}
	.writing-grid.busy {
		opacity: 0.5;
		pointer-events: none;
	}
	@media (max-width: 420px) {
		.writing-grid {
			grid-template-columns: 1fr;
		}
	}
	.load-more {
		display: flex;
		justify-content: center;
		margin-top: 1.5rem;
	}
	.empty {
		padding: 3rem 1.5rem;
	}
	.empty h3 {
		margin-bottom: 0.3rem;
	}
	.empty .btn {
		margin-top: 0.6rem;
	}
</style>
