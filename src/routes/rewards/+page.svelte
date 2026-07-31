<script>
	import Seo from '$lib/components/Seo.svelte';
	import BadgeMedal from '$lib/components/BadgeMedal.svelte';

	let { data } = $props();
	const s = $derived(data.summary);
	const earnedCount = $derived(s.badges.filter((b) => b.earned).length);
	const serial = $derived(
		`TWR-${String(data.user?.id ?? '00000')
			.slice(-5)
			.toUpperCase()}`
	);
</script>

<Seo
	title="Your seals"
	description="Track your seals and milestones in The Writers' Room BLR."
	noindex={true}
/>

<section class="section">
	<div class="container">
		<header class="page-head">
			<p class="eyebrow">Recognition</p>
			<h1>Your seals</h1>
		</header>

		<div class="ticket">
			<div class="stub">
				<span class="v">Keep this stub · {earnedCount} of {s.badges.length} seals pressed</span>
			</div>
			<div class="tbody">
				<div class="thead">★ The Writers&rsquo; Room seal ledger ★</div>
				<div class="big">{earnedCount}<small>of {s.badges.length} seals</small></div>
				<div class="serial">Ticket No. {serial}</div>
				<p class="fine">
					Seals press themselves as you share work - {s.metrics.submissions}
					piece{s.metrics.submissions === 1 ? '' : 's'} shared · {s.metrics.content_types}
					format{s.metrics.content_types === 1 ? '' : 's'} · active in {s.metrics.active_months}
					month{s.metrics.active_months === 1 ? '' : 's'}.
				</p>
			</div>
		</div>

		<section class="block">
			<h2 class="k">Seals &amp; milestones</h2>
			<div class="seals">
				{#each s.badges as b (b.id)}
					<BadgeMedal badge={b} />
				{/each}
			</div>
		</section>
	</div>
</section>

<style>
	.page-head {
		margin-bottom: 1.25rem;
	}
	.page-head h1 {
		margin: 0;
	}

	.ticket {
		display: grid;
		grid-template-columns: 110px 1fr;
		border: 1px solid var(--rule);
		outline: 1px solid var(--rule);
		outline-offset: 2px;
		margin: 0 3px 1.8rem;
		position: relative;
		background: var(--paper);
		max-width: 720px;
	}
	.stub {
		border-right: 2px dashed var(--muted-2);
		display: grid;
		place-items: center;
		padding: 1rem 0.6rem;
	}
	.stub .v {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		text-transform: uppercase;
		letter-spacing: 0.24em;
		font-size: 0.62rem;
		font-weight: 700;
		color: var(--muted);
		white-space: nowrap;
	}
	.ticket::before,
	.ticket::after {
		content: '';
		position: absolute;
		left: 101px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--paper);
		border: 1px solid var(--rule);
		z-index: 2;
	}
	.ticket::before {
		top: -10px;
	}
	.ticket::after {
		bottom: -10px;
	}
	.tbody {
		padding: 1.1rem 1.4rem 1.2rem;
		text-align: center;
	}
	.thead {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.26em;
		color: var(--muted);
	}
	.big {
		font-weight: 700;
		font-size: 3.4rem;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		margin: 0.35rem 0 0.1rem;
	}
	.big small {
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		vertical-align: 0.6em;
		margin-left: 0.45rem;
	}
	.serial {
		font-size: 0.78rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}
	.fine {
		font-size: 0.78rem;
		font-style: italic;
		color: var(--muted);
		border-top: 1px solid var(--hairline);
		margin: 0.7rem 0 0;
		padding-top: 0.5rem;
	}

	.block {
		margin-bottom: 2rem;
	}
	.k {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin: 0 0 0.6rem;
	}
	.k::after {
		content: '';
		flex: 1;
		border-top: 3px double var(--rule);
	}
	.seals {
		display: grid;
		grid-template-columns: 1fr 1fr;
		column-gap: 2.5rem;
	}
	@media (max-width: 860px) {
		.seals {
			grid-template-columns: 1fr;
			column-gap: 0;
		}
	}
	@media (max-width: 560px) {
		.ticket {
			grid-template-columns: 64px 1fr;
		}
		.ticket::before,
		.ticket::after {
			left: 55px;
		}
		.big {
			font-size: 2.6rem;
		}
	}
</style>
