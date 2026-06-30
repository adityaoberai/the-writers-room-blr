<script>
	import Icon from './Icon.svelte';
	let { badge } = $props();
	const earned = $derived(!!badge.earned);
	const pct = $derived(Math.round((badge.progress ?? (earned ? 1 : 0)) * 100));
</script>

<div class="badge" class:earned title={badge.description}>
	<span class="medal">
		<Icon name={badge.icon} size={26} />
	</span>
	<div class="info">
		<strong>{badge.name}</strong>
		{#if badge.description}
			<p class="muted">{badge.description}</p>
		{/if}
		{#if earned}
			<span class="pill pill-green">Earned</span>
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
			<small class="muted">{badge.current ?? 0} / {badge.target}</small>
		{/if}
	</div>
</div>

<style>
	.badge {
		display: flex;
		gap: 0.85rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.badge.earned {
		border-color: #bbf7d0;
		background: #f6fef9;
	}
	.medal {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		background: var(--surface-2);
		color: var(--muted-2);
	}
	.badge.earned .medal {
		background: linear-gradient(135deg, var(--accent), var(--accent-2));
		color: #fff;
	}
	.info {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.info strong {
		font-size: 1rem;
	}
	.info p {
		margin: 0;
		font-size: 0.85rem;
	}
	.bar {
		height: 7px;
		background: var(--surface-2);
		border-radius: 999px;
		overflow: hidden;
		margin-top: 0.2rem;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		border-radius: 999px;
	}
</style>
