<script>
	let { badge } = $props();
	const earned = $derived(!!badge.earned);
	const pct = $derived(Math.round((badge.progress ?? (earned ? 1 : 0)) * 100));
	// A wax-seal monogram instead of an icon: "First Words" → FW.
	const initials = $derived(
		(badge.name ?? '')
			.split(/\s+/)
			.map((w) => w[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);
</script>

<div class="badge" class:earned title={badge.description}>
	<span class="seal" aria-hidden="true">{initials}</span>
	<div class="info">
		<strong>{badge.name}</strong>
		{#if badge.description}
			<p class="desc">{badge.description}</p>
		{/if}
		{#if earned}
			<span class="earned-mark">Seal pressed{badge.earned_at ? '' : ''}</span>
		{:else if badge.target}
			<div
				class="bar"
				role="progressbar"
				aria-valuenow={pct}
				aria-valuemin="0"
				aria-valuemax="100"
				aria-label={`${badge.name} progress`}
			>
				<span style="width:{pct}%"></span>
			</div>
			<small class="count">{badge.current ?? 0} / {badge.target}</small>
		{/if}
	</div>
</div>

<style>
	.badge {
		display: flex;
		gap: 0.85rem;
		padding: 0.85rem 0.2rem;
		border-bottom: 1px dotted var(--hairline);
		background: transparent;
		align-items: flex-start;
	}
	.seal {
		flex-shrink: 0;
		width: 52px;
		height: 52px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1px dashed var(--muted-2);
		color: var(--muted-2);
		font-weight: 700;
		font-size: 1rem;
		letter-spacing: 0.04em;
	}
	.badge.earned .seal {
		border: 1px solid var(--rule);
		box-shadow:
			inset 0 0 0 3px var(--paper),
			inset 0 0 0 4px var(--rule);
		color: var(--ink);
	}
	.info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.info strong {
		font-size: 1rem;
	}
	.desc {
		margin: 0;
		font-size: 0.84rem;
		font-style: italic;
		color: var(--muted);
	}
	.earned-mark {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: var(--ledger);
	}
	.bar {
		height: 5px;
		background: var(--paper-shade);
		border: 1px solid var(--hairline);
		overflow: hidden;
		margin-top: 0.2rem;
		max-width: 220px;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--ink);
	}
	.count {
		color: var(--muted);
		font-style: italic;
	}
</style>
