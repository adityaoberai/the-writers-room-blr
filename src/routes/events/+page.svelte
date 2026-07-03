<script>
	import Seo from '$lib/components/Seo.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import { formatDate } from '$lib/format.js';

	let { data } = $props();
</script>

<Seo
	title="Events & meetups"
	description="Upcoming Writers' Room BLR meetups plus a look back at past sessions."
/>

<section class="section">
	<div class="container">
		<header class="page-head">
			<p class="eyebrow">Meetups</p>
			<h1>Events</h1>
			<p class="lead">
				Reserve your spot on Luma. Sessions are calm and phone-down. Bring whatever you're working
				on.
			</p>
			<a class="btn btn-primary" href={data.luma_url} target="_blank" rel="noopener noreferrer">
				Events calendar
			</a>
		</header>

		{#if data.ongoing.length}
			<h2>Happening now</h2>
			<div class="grid grid-3 upcoming">
				{#each data.ongoing as e (e.id)}
					<EventCard event={e} />
				{/each}
			</div>
		{/if}

		<h2>Upcoming meetups</h2>
		{#if data.upcoming.length}
			<div class="grid grid-3 upcoming">
				{#each data.upcoming as e (e.id)}
					<EventCard event={e} />
				{/each}
			</div>
		{:else}
			<p class="empty muted">
				No meetups are scheduled right now — check back soon for the next session.
			</p>
		{/if}

		{#if data.past.length}
			<h2 class="archive-head">Past meetups</h2>
			<ul class="archive">
				{#each data.past as e (e.id)}
					<li class="card">
						<div>
							<strong>{e.title}</strong>
							<span class="muted"> · {e.location}</span>
						</div>
						<time class="muted">{formatDate(e.start_at)}</time>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.page-head {
		max-width: 680px;
		margin-bottom: 1.5rem;
	}
	.page-head h1 {
		margin-bottom: 0.4rem;
	}
	.page-head .btn {
		margin-top: 0.5rem;
	}
	.upcoming {
		margin-bottom: 2.5rem;
	}
	.empty {
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		padding: 2rem 1.5rem;
		text-align: center;
		margin: 0 0 2.5rem;
	}
	h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}
	.archive-head {
		margin-top: 2.5rem;
	}
	.archive {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.archive li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.2rem;
		flex-wrap: wrap;
	}
</style>
