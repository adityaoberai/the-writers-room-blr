<script>
	let { src = '', name = '', size = 48 } = $props();

	const initials = $derived(
		(name || '?')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? '')
			.join('') || '?'
	);
</script>

{#if src}
	<img
		class="avatar"
		{src}
		alt={name ? `${name}'s photo` : 'Member photo'}
		width={size}
		height={size}
		style="width:{size}px;height:{size}px"
		loading="lazy"
	/>
{:else}
	<span
		class="avatar-fallback"
		aria-hidden="true"
		style="width:{size}px;height:{size}px;font-size:{Math.round(size * 0.4)}px"
	>
		{initials}
	</span>
{/if}
