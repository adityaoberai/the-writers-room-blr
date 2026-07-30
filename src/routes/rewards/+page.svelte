<script>
	import Seo from '$lib/components/Seo.svelte';
	import BadgeMedal from '$lib/components/BadgeMedal.svelte';
	import { formatNumber, formatDate } from '$lib/format.js';

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
	title="Your rewards"
	description="Track your points, badges and milestones in The Writers' Room BLR."
	noindex={true}
/>

<section class="section">
	<div class="container">
		<header class="page-head">
			<p class="eyebrow">Recognition</p>
			<h1>Your rewards</h1>
		</header>

		<div class="ticket">
			<div class="stub">
				<span class="v">Keep this stub · {earnedCount} of {s.badges.length} seals pressed</span>
			</div>
			<div class="tbody">
				<div class="thead">★ The Writers&rsquo; Room prize ledger ★</div>
				<div class="big">{formatNumber(s.total_points)}<small>PTS</small></div>
				<div class="serial">Ticket No. {serial}</div>
				<p class="fine">
					Points accrue for showing up and sharing work - {s.metrics.submissions}
					piece{s.metrics.submissions === 1 ? '' : 's'} shared · {s.metrics.attendance}
					session{s.metrics.attendance === 1 ? '' : 's'} attended · profile
					{s.metrics.profile_complete ? 'complete' : 'incomplete'}.
				</p>
			</div>
		</div>

		<div class="cols">
			<section class="block">
				<h2 class="k">The prize board</h2>
				{#each data.rules as r (r.action)}
					<div class="prize">
						<span class="pts">+{r.points}</span>
						<span class="for">{r.label}</span>
						<span class="leader"></span>
					</div>
				{/each}
			</section>

			<section class="block">
				<h2 class="k">Seals &amp; milestones</h2>
				<div class="seals">
					{#each s.badges as b (b.id)}
						<BadgeMedal badge={b} />
					{/each}
				</div>
			</section>
		</div>

		<section class="block history">
			<h2 class="k">Activity history</h2>
			{#if s.activity_logs.length}
				<div class="table-wrap">
					<table class="data">
						<thead>
							<tr><th>Date</th><th>Entry</th><th>Notes</th><th class="num">Points</th></tr>
						</thead>
						<tbody>
							{#each s.activity_logs as log (log.id)}
								<tr>
									<td class="mut">{formatDate(log.created_at)}</td>
									<td><b>{log.label}</b></td>
									<td class="mut">{log.notes || '-'}</td>
									<td class="num credit">+{log.points_awarded}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="tolet">
					<div class="tolet-head">No entries in the ledger yet</div>
					<p>
						<a href="/submit">Share a piece</a> or complete your <a href="/me">profile</a> to start earning.
					</p>
				</div>
			{/if}
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
		vertical-align: 0.6em;
		margin-left: 0.25rem;
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

	.cols {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 2rem;
		align-items: start;
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
	.prize {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.42rem 0;
		border-bottom: 1px dotted var(--hairline);
		font-size: 0.98rem;
	}
	.prize .pts {
		font-weight: 700;
		color: var(--ledger);
		font-variant-numeric: tabular-nums;
		min-width: 3rem;
	}
	.seals {
		display: grid;
	}
	.history .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.credit {
		color: var(--ledger);
		font-weight: 700;
	}
	.mut {
		color: var(--muted);
	}
	@media (max-width: 860px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 0;
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
