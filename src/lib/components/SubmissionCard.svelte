<script>
	let { submission, compact = false } = $props();
	const tags = $derived((submission.tags ?? []).slice(0, 3));
</script>

<a class="slot" class:compact href={`/writing/${submission.id}`}>
	{#if submission.status === 'featured'}
		<span class="stamp st-featured fstamp">★ Featured</span>
	{/if}
	<span class="type">{submission.content_type_label ?? submission.content_type}</span>
	<h3>{submission.title}</h3>
	{#if submission.author}
		<span class="by">by {submission.author.display_name ?? submission.author}</span>
	{/if}
	{#if submission.summary && !compact}
		<p class="sum">{submission.summary}</p>
	{/if}
	{#if tags.length && !compact}
		<span class="hashes">{tags.map((t) => `#${t}`).join('  ')}</span>
	{/if}
	<span class="read">Read ↗</span>
</a>

<style>
	/* A classified slot — designed to sit inside a shared-rule .classifieds grid. */
	.slot {
		background: var(--paper);
		padding: 0.85rem 0.95rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		position: relative;
		text-decoration: none;
		color: inherit;
		min-width: 0;
	}
	.slot:hover {
		background: var(--paper-shade);
		color: inherit;
	}
	.fstamp {
		position: absolute;
		top: 0.55rem;
		right: 0.55rem;
		font-size: 0.6rem;
		padding: 0.14rem 0.45rem;
	}
	.type {
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: var(--muted);
	}
	h3 {
		margin: 0;
		font-size: 1.12rem;
		line-height: 1.18;
		overflow-wrap: anywhere;
		padding-right: 4.5rem;
	}
	.by {
		font-variant: small-caps;
		letter-spacing: 0.04em;
		font-size: 0.88rem;
		color: var(--ink-soft);
	}
	.sum {
		font-size: 0.84rem;
		font-style: italic;
		color: var(--muted);
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.hashes {
		font-size: 0.78rem;
		color: var(--muted);
	}
	.read {
		margin-top: auto;
		padding-top: 0.4rem;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.slot.compact .sum,
	.slot.compact .hashes {
		display: none;
	}
</style>
