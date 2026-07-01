<script>
	import Seo from '$lib/components/Seo.svelte';
	import SubmissionCard from '$lib/components/SubmissionCard.svelte';

	let { data } = $props();
	const user = $derived(data.user);

	let query = $state('');
	let activeType = $state('');
	let sort = $state('newest');

	const norm = (s) => (s ?? '').toString().toLowerCase();
	const authorName = (s) =>
		typeof s.author === 'string' ? s.author : (s.author?.display_name ?? '');

	// Only show type chips for types that actually have pieces.
	const availableTypes = $derived(
		data.types.filter((t) => data.submissions.some((s) => s.content_type === t.key))
	);

	const filtered = $derived.by(() => {
		const q = norm(query).trim();
		const list = data.submissions.filter((s) => {
			if (activeType && s.content_type !== activeType) return false;
			if (!q) return true;
			const hay = norm([s.title, s.summary, authorName(s), ...(s.tags ?? [])].join(' '));
			return hay.includes(q);
		});
		return [...list].sort((a, b) => {
			if (sort === 'title') return norm(a.title).localeCompare(norm(b.title));
			const da = a.created_at ?? '';
			const db = b.created_at ?? '';
			return sort === 'oldest' ? da.localeCompare(db) : db.localeCompare(da);
		});
	});
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

		{#if data.submissions.length}
			<div class="controls">
				<div class="search">
					<input
						type="search"
						placeholder="Search titles, summaries, authors, tags…"
						bind:value={query}
						aria-label="Search writing"
					/>
				</div>
				<label class="sort">
					<span class="visually-hidden">Sort pieces</span>
					<select bind:value={sort}>
						<option value="newest">Newest first</option>
						<option value="oldest">Oldest first</option>
						<option value="title">Title A–Z</option>
					</select>
				</label>
			</div>

			<div class="chips" role="group" aria-label="Filter by type">
				<button
					type="button"
					class="chip"
					class:is-active={!activeType}
					onclick={() => (activeType = '')}
				>
					All
				</button>
				{#each availableTypes as t (t.key)}
					<button
						type="button"
						class="chip"
						class:is-active={activeType === t.key}
						onclick={() => (activeType = t.key)}
					>
						{t.label}
					</button>
				{/each}
			</div>

			{#if filtered.length}
				<p class="result-count muted">
					{filtered.length} piece{filtered.length === 1 ? '' : 's'}
				</p>
				<div class="writing-grid">
					{#each filtered as s (s.id)}
						<SubmissionCard submission={s} compact />
					{/each}
				</div>
			{:else}
				<div class="card center empty">
					<h3>No matches</h3>
					<p class="muted">Try a different search term or clear the filters.</p>
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
		margin-bottom: 0.9rem;
	}
	.controls .search {
		flex: 1 1 320px;
	}
	.controls .sort {
		flex: 0 0 auto;
		margin: 0;
	}
	.controls .sort select {
		width: auto;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.1rem;
	}
	.chips .chip {
		font-family: inherit;
		font-size: 0.82rem;
	}
	.result-count {
		margin: 0 0 1rem;
		font-size: 0.9rem;
	}
	.writing-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
