<script>
	import Icon from './Icon.svelte';
	import { formatDate, formatTime } from '$lib/format.js';
	let { event } = $props();
</script>

<article class="card event">
	{#if event.status === 'ongoing'}
		<span class="live">Happening now</span>
	{/if}
	<div class="when">
		<Icon name="calendar" size={20} />
		<span>{event.start_at ? formatDate(event.start_at) : 'Date to be announced'}</span>
		{#if event.start_at}
			<span class="muted">
				· {formatTime(event.start_at)}{#if event.end_at}–{formatTime(event.end_at)}{/if}
			</span>
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
	.live {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #fff;
		background: var(--accent-strong);
	}
	.live::before {
		content: '';
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: currentColor;
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
