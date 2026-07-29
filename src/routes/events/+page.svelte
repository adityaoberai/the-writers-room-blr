<script>
	import Seo from '$lib/components/Seo.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import { formatDate, formatTime } from '$lib/format.js';

	let { data } = $props();

	// The next session takes the playbill; the rest run as smaller ads.
	const all = $derived([...data.ongoing, ...data.upcoming]);
	const bill = $derived(all[0] ?? null);
	const rest = $derived(all.slice(1));
	const billLive = $derived(bill?.status === 'ongoing');
</script>

<Seo
	title="Events & meetups"
	description="Upcoming Writers' Room BLR meetups plus a look back at past sessions."
/>

<section class="section">
	<div class="container">
		<div class="folio">
			<span>The Writers&rsquo; Room BLR</span>
			<span class="folio-mid">Amusements &amp; gatherings</span>
			<span>Page E1</span>
		</div>

		<header class="page-head">
			<p class="eyebrow">Meetups</p>
			<div class="headrow">
				<h1>Events</h1>
				<a href={data.luma_url} target="_blank" rel="noopener noreferrer">Events calendar ↗</a>
			</div>
			<p class="lead">
				Reserve your spot on Luma. Sessions are calm and phone-down. Bring whatever you're working
				on.
			</p>
		</header>

		{#if bill}
			<div class="bill">
				<span class="now">{billLive ? 'Now seating' : 'Next session'}</span>
				{#if billLive}
					<span class="live-marker bill-live"><i></i> Happening now</span>
				{/if}
				<div class="bigdate">
					{bill.start_at ? formatDate(bill.start_at) : 'Date to be announced'}
				</div>
				{#if bill.start_at}
					<div class="times">
						{formatTime(bill.start_at)}{#if bill.end_at}&nbsp;—&nbsp;{formatTime(bill.end_at)}{/if}
					</div>
				{/if}
				<h2>{bill.title}</h2>
				{#if bill.location}
					<div class="venue">{bill.location}</div>
				{/if}
				<hr class="rulehr" />
				{#if bill.description}
					<p class="line">{bill.description}</p>
				{/if}
				{#if bill.external_url}
					<a class="ticket" href={bill.external_url} target="_blank" rel="noopener noreferrer">
						Admit one — Register on Luma
					</a>
				{/if}
			</div>
		{:else}
			<div class="tolet billspace">
				<div class="tolet-head">This space to let</div>
				<p>No meetups are scheduled right now — check back soon for the next session.</p>
			</div>
		{/if}

		{#if rest.length}
			<div class="grid grid-3 smalls">
				{#each rest as e (e.id)}
					<EventCard event={e} />
				{/each}
			</div>
		{/if}

		{#if data.past.length}
			<div class="past">
				<h2 class="past-head">Past programmes</h2>
				<ul class="archive">
					{#each data.past as e (e.id)}
						<li class="prog">
							<b>{e.title}</b>
							{#if e.location}<span class="v">{e.location}</span>{/if}
							<span class="leader"></span>
							<time class="dt">{formatDate(e.start_at)}</time>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</section>

<style>
	.folio {
		margin-bottom: 1.2rem;
	}
	.page-head {
		max-width: 680px;
		margin-bottom: 1.4rem;
	}
	.headrow {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.headrow h1 {
		margin-bottom: 0.3rem;
	}
	.headrow a {
		font-size: 0.9rem;
		white-space: nowrap;
	}
	.page-head .lead {
		margin-bottom: 0;
	}

	.bill {
		border: 3px solid var(--rule);
		outline: 1px solid var(--rule);
		outline-offset: 3px;
		margin: 0 4px 1.3rem;
		padding: 1.6rem 1.4rem 1.5rem;
		text-align: center;
		background: var(--paper);
	}
	.now {
		display: inline-block;
		background: var(--ink);
		color: var(--paper);
		text-transform: uppercase;
		letter-spacing: 0.3em;
		font-weight: 700;
		font-size: 0.72rem;
		padding: 0.3rem 0.9rem;
	}
	.bill-live {
		margin-left: 0.8rem;
	}
	.bigdate {
		font-weight: 700;
		font-size: clamp(1.7rem, 4.5vw, 2.5rem);
		line-height: 1;
		margin: 0.7rem 0 0.15rem;
		letter-spacing: -0.01em;
		text-transform: uppercase;
	}
	.times {
		font-variant: small-caps;
		letter-spacing: 0.08em;
		color: var(--ink-soft);
	}
	.bill h2 {
		margin: 0.5rem 0 0.2rem;
		font-size: clamp(1.5rem, 3.6vw, 1.9rem);
		line-height: 1.05;
	}
	.venue {
		font-variant: small-caps;
		font-size: 1.05rem;
		letter-spacing: 0.05em;
		color: var(--ink-soft);
	}
	.rulehr {
		border: none;
		border-top: 1px solid var(--hairline);
		margin: 0.8rem 22%;
	}
	.line {
		margin: 0 0 1rem;
		font-style: italic;
		color: var(--muted);
		font-size: 0.94rem;
	}
	.ticket {
		display: inline-block;
		background: var(--cta);
		color: #fff;
		text-decoration: none;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.78rem;
		padding: 0.85rem 1.6rem;
		position: relative;
	}
	.ticket::before {
		content: '';
		position: absolute;
		inset: 3px;
		border: 1px dashed rgba(255, 255, 255, 0.75);
		pointer-events: none;
	}
	.ticket:hover {
		background: var(--cta-deep);
		color: #fff;
	}
	.billspace {
		margin-bottom: 1.3rem;
	}

	.smalls {
		margin-bottom: 1rem;
	}

	.past {
		margin-top: 1.8rem;
		border-top: 3px double var(--rule);
		padding-top: 0.6rem;
	}
	.past-head {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		margin: 0 0 0.4rem;
	}
	.archive {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.prog {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.34rem 0;
		border-bottom: 1px dotted var(--hairline);
		font-size: 0.95rem;
	}
	.prog .v {
		font-variant: small-caps;
		color: var(--muted);
		white-space: nowrap;
	}
	.prog .dt {
		color: var(--muted);
		font-size: 0.85rem;
		white-space: nowrap;
	}
	@media (max-width: 560px) {
		.folio-mid {
			display: none;
		}
		.prog .v {
			display: none;
		}
	}
</style>
