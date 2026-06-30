<script>
	import Seo from '$lib/components/Seo.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import BadgeMedal from '$lib/components/BadgeMedal.svelte';
	import { formatNumber, formatDate } from '$lib/format.js';

	let { data } = $props();
	const s = $derived(data.summary);
	const earnedCount = $derived(s.badges.filter((b) => b.earned).length);
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

		<div class="hero-cards">
			<div class="card big">
				<span class="big-num">{formatNumber(s.total_points)}</span>
				<span class="muted">total points</span>
			</div>
			<div class="card big">
				<span class="big-num">{earnedCount}<span class="of">/ {s.badges.length}</span></span>
				<span class="muted">badges earned</span>
			</div>
			<div class="card big">
				<span class="big-num">{s.metrics.submissions}</span>
				<span class="muted">pieces shared</span>
			</div>
		</div>

		<section class="block">
			<h2>How to earn points</h2>
			<div class="grid grid-3">
				{#each data.rules as r (r.action)}
					<div class="card rule">
						<span class="pts">+{r.points}</span>
						<span>{r.label}</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="block">
			<h2>Badges & milestones</h2>
			<div class="grid grid-2">
				{#each s.badges as b (b.id)}
					<BadgeMedal badge={b} />
				{/each}
			</div>
		</section>

		<section class="block">
			<h2>Activity history</h2>
			{#if s.activity_logs.length}
				<ul class="activity">
					{#each s.activity_logs as log (log.id)}
						<li class="card">
							<span class="dot"><Icon name="check" size={16} /></span>
							<div class="act-main">
								<strong>{log.label}</strong>
								{#if log.notes}<span class="muted"> · {log.notes}</span>{/if}
								<span class="muted date">{formatDate(log.created_at)}</span>
							</div>
							<span class="gain">+{log.points_awarded}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="card muted">
					No activity yet. <a href="/submit">Share a piece</a> or complete your
					<a href="/me">profile</a> to start earning.
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
	.hero-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.big {
		text-align: center;
		padding: 1.6rem 1rem;
	}
	.big-num {
		display: block;
		font-family: var(--font-serif);
		font-size: 2.6rem;
		font-weight: 700;
		color: var(--accent-strong);
		line-height: 1;
	}
	.big-num .of {
		font-size: 1.3rem;
		color: var(--muted-2);
	}
	.block {
		margin-bottom: 2.5rem;
	}
	.block h2 {
		font-size: 1.4rem;
		margin-bottom: 1rem;
	}
	.rule {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}
	.rule .pts {
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: 1.4rem;
		color: var(--highlight);
		min-width: 3rem;
	}
	.activity {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.activity li {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.8rem 1rem;
	}
	.dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: 999px;
		background: #dcfce7;
		color: #166534;
		flex-shrink: 0;
	}
	.act-main {
		flex: 1;
		min-width: 0;
	}
	.act-main .date {
		display: block;
		font-size: 0.82rem;
	}
	.gain {
		font-weight: 700;
		color: var(--success);
	}
</style>
