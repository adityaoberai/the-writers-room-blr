<script>
	import Seo from '$lib/components/Seo.svelte';
	import SubmissionCard from '$lib/components/SubmissionCard.svelte';

	let { data } = $props();
	const submissions = $derived(data.submissions);
	const user = $derived(data.user);
	const typeHref = (t) => (t ? `/writing?type=${t}` : '/writing');
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

		<div class="chips" role="group" aria-label="Filter by type">
			<a class="chip" class:is-active={!data.type} href={typeHref('')}>All</a>
			{#each data.types as t (t.key)}
				<a class="chip" class:is-active={data.type === t.key} href={typeHref(t.key)}>{t.label}</a>
			{/each}
		</div>

		{#if submissions.length}
			<div class="grid grid-3">
				{#each submissions as s (s.id)}
					<SubmissionCard submission={s} />
				{/each}
			</div>
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
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.chips .chip {
		text-decoration: none;
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
