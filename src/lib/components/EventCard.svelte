<script>
	import { formatDate, formatTime } from '$lib/format.js';
	let { event } = $props();
</script>

<article class="adbox-double ad">
	{#if event.status === 'ongoing'}
		<span class="live-marker"><i></i> Happening now</span>
	{:else}
		<span class="no">Advt. — Meetup</span>
	{/if}
	<div class="date">{event.start_at ? formatDate(event.start_at) : 'Date to be announced'}</div>
	{#if event.start_at}
		<div class="time">
			{formatTime(event.start_at)}{#if event.end_at}&nbsp;—&nbsp;{formatTime(event.end_at)}{/if}
		</div>
	{/if}
	<h3>{event.title}</h3>
	{#if event.location}
		<div class="venue">{event.location}</div>
	{/if}
	<hr class="rulehr" />
	{#if event.description}
		<p class="line">{event.description}</p>
	{/if}
	{#if event.external_url}
		<a
			class="btn btn-primary btn-sm"
			href={event.external_url}
			target="_blank"
			rel="noopener noreferrer"
		>
			Register on Luma
		</a>
	{/if}
</article>

<style>
	.ad {
		padding: 1.1rem 1.2rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		height: calc(100% - 6px);
	}
	.no {
		font-size: 0.64rem;
		text-transform: uppercase;
		letter-spacing: 0.22em;
		color: var(--muted);
	}
	.live-marker {
		justify-content: center;
	}
	.date {
		font-weight: 700;
		font-size: 1.02rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-top: 0.2rem;
	}
	.time {
		font-variant: small-caps;
		letter-spacing: 0.06em;
		font-size: 0.92rem;
		color: var(--ink-soft);
	}
	h3 {
		margin: 0.3rem 0 0.1rem;
		font-size: 1.4rem;
		line-height: 1.1;
	}
	.venue {
		font-variant: small-caps;
		letter-spacing: 0.05em;
		color: var(--ink-soft);
		font-size: 0.95rem;
	}
	.rulehr {
		border: none;
		border-top: 1px solid var(--hairline);
		margin: 0.4rem 1.5rem;
		width: auto;
		align-self: stretch;
	}
	.line {
		font-size: 0.86rem;
		font-style: italic;
		color: var(--muted);
		margin: 0 0 0.6rem;
	}
	.btn {
		margin-top: auto;
		align-self: center;
	}
</style>
