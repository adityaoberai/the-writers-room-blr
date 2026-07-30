<script>
	let { badge, plain = false } = $props();
	const earned = $derived(!!badge.earned);
	const pct = $derived(Math.round((badge.progress ?? (earned ? 1 : 0)) * 100));
	const name = $derived((badge.name ?? '').toUpperCase());
	// The name sets along the top arc; long names take a smaller cut of type.
	const nameSize = $derived(
		Math.min(10.5, Math.max(6.5, Math.round(132 / Math.max(1, name.length))))
	);
	const year = $derived(badge.earned_at ? new Date(badge.earned_at).getFullYear() : '');
</script>

{#snippet seal()}
	<svg class="sealsvg" class:earned viewBox="0 0 100 100" role="img" aria-label={badge.name}>
		<defs>
			<path id={`seal-top-${badge.id}`} d="M 16 50 A 34 34 0 0 1 84 50" />
			<path id={`seal-bot-${badge.id}`} d="M 16 50 A 34 34 0 0 0 84 50" />
		</defs>
		<circle class="ring outer" cx="50" cy="50" r="48" />
		<circle class="ring" cx="50" cy="50" r="43.5" />
		<circle class="ring thin" cx="50" cy="50" r="25" />
		<text class="arcname" style={`font-size:${nameSize}px`}>
			<textPath href={`#seal-top-${badge.id}`} startOffset="50%">{name}</textPath>
		</text>
		<text class="arcorg">
			<textPath href={`#seal-bot-${badge.id}`} startOffset="50%">
				★ THE WRITERS&rsquo; ROOM BLR ★
			</textPath>
		</text>
		<text class="star" x="50" y={year ? 48 : 55}>★</text>
		{#if year}<text class="year" x="50" y="63">{year}</text>{/if}
	</svg>
{/snippet}

{#if plain}
	<span class="lone" title={badge.description}>{@render seal()}</span>
{:else}
	<div class="badge" title={badge.description}>
		{@render seal()}
		<div class="info">
			<strong>{badge.name}</strong>
			{#if badge.description}
				<p class="desc">{badge.description}</p>
			{/if}
			{#if !earned && badge.target}
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
{/if}

<style>
	.badge {
		display: flex;
		gap: 1rem;
		padding: 0.85rem 0.2rem;
		border-bottom: 1px dotted var(--hairline);
		background: transparent;
		align-items: center;
	}
	.lone {
		display: inline-block;
	}
	/* An inked rubber seal: double outer ring, the badge name around the top,
	   the room around the bottom — pressed at a slight angle. */
	.sealsvg {
		flex-shrink: 0;
		width: 88px;
		height: 88px;
		display: block;
		color: var(--muted-2);
	}
	.sealsvg.earned {
		color: var(--ledger);
		transform: rotate(-7deg);
	}
	.ring {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	.ring.outer {
		stroke-width: 2.6;
	}
	.ring.thin {
		stroke-width: 0.9;
	}
	.sealsvg:not(.earned) .ring.outer {
		stroke-dasharray: 3 2.4;
	}
	.sealsvg text {
		fill: currentColor;
	}
	.arcname textPath,
	.arcorg textPath,
	.star,
	.year {
		text-anchor: middle;
	}
	.arcname {
		font-weight: 700;
		letter-spacing: 0.12em;
	}
	.arcorg {
		font-size: 5.6px;
		letter-spacing: 0.12em;
	}
	.star {
		font-size: 12px;
	}
	.year {
		font-size: 8px;
		letter-spacing: 0.2em;
		font-weight: 700;
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
