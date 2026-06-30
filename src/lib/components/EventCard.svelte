<script>
	import Icon from './Icon.svelte';
	import { formatDate, formatTime } from '$lib/format.js';
	let { event } = $props();
</script>

<article class="card event">
	<div class="when">
		<Icon name="calendar" size={20} />
		<span>{event.start_at ? formatDate(event.start_at) : 'Date to be announced'}</span>
		{#if event.start_at}
			<span class="muted">· {formatTime(event.start_at)}</span>
		{/if}
	</div>
	<h3>{event.title}</h3>
	{#if event.location}
		<p class="loc muted">{event.location}</p>
	{/if}
	{#if event.description}
		<p class="desc">{event.description}</p>
	{/if}
	{#if event.external_url}
		<a
			class="btn btn-secondary btn-sm"
			href={event.external_url}
			target="_blank"
			rel="noopener noreferrer"
		>
			Register on Luma
		</a>
	{/if}
</article>

<style>
	.event {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		height: 100%;
	}
	.when {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--accent-strong);
		font-weight: 600;
		font-size: 0.9rem;
	}
	h3 {
		margin: 0.2rem 0 0;
		font-size: 1.3rem;
	}
	.loc {
		margin: 0;
		font-size: 0.9rem;
	}
	.desc {
		margin: 0.2rem 0 0.6rem;
		color: var(--muted);
	}
	.btn {
		align-self: flex-start;
		margin-top: auto;
	}
</style>
