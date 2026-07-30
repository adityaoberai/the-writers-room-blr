<script>
	import Seo from '$lib/components/Seo.svelte';
	import MemberCard from '$lib/components/MemberCard.svelte';

	let { data } = $props();
	const members = $derived(data.members);
	const genres = $derived(data.genres);

	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	// Phone-book grouping: strict A–Z by display name, ★ marks featured. Sorted
	// input keeps each letter's run contiguous, so groups build up in order.
	const groups = $derived.by(() => {
		const sorted = [...members].sort((a, b) =>
			(a.display_name || '').localeCompare(b.display_name || '')
		);
		const out = [];
		for (const m of sorted) {
			const c = (m.display_name?.[0] ?? '#').toUpperCase();
			const key = c >= 'A' && c <= 'Z' ? c : '#';
			const last = out[out.length - 1];
			if (last && last.letter === key) last.list.push(m);
			else out.push({ letter: key, list: [m] });
		}
		return out;
	});
	const hasLetter = (L) => groups.some((g) => g.letter === L);

	const chipHref = (g) => {
		const parts = [];
		if (data.search) parts.push(`search=${encodeURIComponent(data.search)}`);
		if (g) parts.push(`genre=${encodeURIComponent(g)}`);
		return parts.length ? `/directory?${parts.join('&')}` : '/directory';
	};
</script>

<Seo
	title="Member directory"
	description="Discover writers in The Writers' Room BLR. Search and filter members by genre, interest and writing focus."
/>

<section class="section">
	<div class="container">
		<div class="folio">
			<span>The Writers&rsquo; Room BLR - Directory</span>
			<span class="folio-mid">{members.length} member{members.length === 1 ? '' : 's'} listed</span>
			<span>Page D1</span>
		</div>

		<header class="page-head">
			<p class="eyebrow">Community</p>
			<h1>Member directory</h1>
			<p class="lead">
				Find writers with shared interests. Members appear here once they've shared their first
				piece.
			</p>
		</header>

		<form class="search" method="GET" role="search">
			<div class="blank">
				<label for="dir-search">Look up a member</label>
				<input
					type="search"
					id="dir-search"
					name="search"
					placeholder="Search by name, bio or genre…"
					value={data.search}
				/>
			</div>
			{#if data.genre}
				<input type="hidden" name="genre" value={data.genre} />
			{/if}
			<button class="btn btn-primary" type="submit">Search</button>
		</form>

		{#if genres.length}
			<div class="chips" role="group" aria-label="Filter by genre">
				<a class="chip" class:is-active={!data.genre} href={chipHref('')}>All genres</a>
				{#each genres as g (g)}
					<a class="chip" class:is-active={data.genre === g} href={chipHref(g)}>{g}</a>
				{/each}
			</div>
		{/if}

		{#if members.length}
			<nav class="tabs" aria-label="Jump to name initial">
				{#each alphabet as L (L)}
					{#if hasLetter(L)}
						<a href={`#letter-${L}`}>{L}</a>
					{:else}
						<span class="dead">{L}</span>
					{/if}
				{/each}
			</nav>

			<p class="count">
				{members.length}
				{members.length === 1 ? 'member' : 'members'}
				{#if data.search || data.genre}
					· <a href="/directory">clear filters</a>
				{/if}
			</p>

			{#each groups as g (g.letter)}
				<div class="group" id={`letter-${g.letter}`}>
					<div class="bigletter">{g.letter}</div>
					<div class="people entries">
						{#each g.list as member (member.profile_id)}
							<MemberCard {member} />
						{/each}
					</div>
				</div>
			{/each}
		{:else}
			<div class="tolet">
				<div class="tolet-head">No listings under this heading</div>
				<p>
					{#if data.search || data.genre}
						Try a different search or <a href="/directory">clear the filters</a>.
					{:else}
						Be the first: <a href="/signin">sign in</a>, complete your profile, and share a piece of
						writing.
					{/if}
				</p>
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
	.search {
		display: flex;
		gap: 0.9rem;
		margin-bottom: 1rem;
		align-items: flex-end;
		max-width: 34rem;
	}
	.search .blank {
		flex: 1;
		min-width: 220px;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-bottom: 1.1rem;
	}
	.tabs {
		display: flex;
		align-items: flex-end;
		border-bottom: 2px solid var(--rule);
		overflow-x: auto;
	}
	.tabs a,
	.tabs .dead {
		flex: 1;
		min-width: 2ch;
		text-align: center;
		font-weight: 700;
		font-size: 0.8rem;
		letter-spacing: 0.05em;
		text-decoration: none;
		padding: 0.3rem 0.2rem;
		margin-right: 2px;
	}
	.tabs a {
		color: var(--ink);
		border: 1px solid var(--hairline);
		border-bottom: none;
		background: var(--paper-shade);
	}
	.tabs a:hover {
		background: var(--ink);
		color: var(--paper);
		border-color: var(--ink);
		padding-top: 0.5rem;
	}
	.tabs .dead {
		color: var(--muted-2);
		border: 1px solid transparent;
	}
	/* On a phone the rail folds into two rows of thirteen tabs rather than
	   cramming twenty-six into one line. */
	@media (max-width: 640px) {
		.tabs {
			flex-wrap: wrap;
			row-gap: 2px;
			overflow-x: visible;
		}
		.tabs a,
		.tabs .dead {
			flex: 0 0 calc(100% / 13 - 2px);
		}
	}
	.count {
		font-size: 0.82rem;
		font-style: italic;
		color: var(--muted);
		margin: 0.7rem 0 1.1rem;
	}
	.group {
		display: grid;
		grid-template-columns: 3.2rem 1fr;
		gap: 1.2rem;
		margin-bottom: 1.4rem;
		scroll-margin-top: 4rem;
	}
	.bigletter {
		font-weight: 700;
		font-size: 2.6rem;
		line-height: 0.9;
		border-top: 3px solid var(--rule);
		padding-top: 0.4rem;
	}
	.entries {
		border-top: 3px solid var(--rule);
		padding-top: 0.4rem;
	}
	.tolet {
		max-width: 42rem;
	}
	@media (max-width: 560px) {
		.folio-mid {
			display: none;
		}
		.group {
			grid-template-columns: 2.2rem 1fr;
			gap: 0.8rem;
		}
		.bigletter {
			font-size: 1.9rem;
		}
	}
</style>
