<script>
	import Seo from '$lib/components/Seo.svelte';
	import MemberCard from '$lib/components/MemberCard.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data } = $props();
	const members = $derived(data.members);
	const genres = $derived(data.genres);

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
		<header class="page-head">
			<p class="eyebrow">Community</p>
			<h1>Member directory</h1>
			<p class="lead">
				Find writers with shared interests. Members appear here once they've shared their first
				piece.
			</p>
		</header>

		<form class="search" method="GET" role="search">
			<div class="search-field">
				<Icon name="people" size={18} />
				<input
					type="search"
					name="search"
					placeholder="Search by name, bio or genre…"
					value={data.search}
					aria-label="Search members"
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

		<p class="count muted">{members.length} {members.length === 1 ? 'member' : 'members'}</p>

		{#if members.length}
			<div class="grid grid-3">
				{#each members as member (member.profile_id)}
					<MemberCard {member} />
				{/each}
			</div>
		{:else}
			<div class="card center empty">
				<h3>No members match yet</h3>
				<p class="muted">
					{#if data.search || data.genre}
						Try a different search or clear the filters.
					{:else}
						Be the first: sign in, complete your profile, and share a piece of writing.
					{/if}
				</p>
				<a class="btn btn-primary" href={data.search || data.genre ? '/directory' : '/signin'}>
					{data.search || data.genre ? 'Clear filters' : 'Join the room'}
				</a>
			</div>
		{/if}
	</div>
</section>

<style>
	.page-head {
		max-width: 640px;
		margin-bottom: 1.5rem;
	}
	.page-head h1 {
		margin-bottom: 0.4rem;
	}
	.search {
		display: flex;
		gap: 0.6rem;
		margin-bottom: 1.1rem;
		flex-wrap: wrap;
	}
	.search-field {
		flex: 1;
		min-width: 240px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding-left: 0.8rem;
		color: var(--muted-2);
	}
	.search-field input {
		border: none;
		background: transparent;
		padding-left: 0.3rem;
	}
	.search-field input:focus {
		outline: none;
		box-shadow: none;
	}
	.search-field:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(47, 111, 176, 0.2);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}
	.chips .chip {
		text-decoration: none;
	}
	.count {
		margin-bottom: 1rem;
		font-size: 0.9rem;
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
