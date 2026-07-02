<script>
	let { submission, compact = false } = $props();
	const tags = $derived((submission.tags ?? []).slice(0, 3));
	const image = $derived(submission.preview_image || '/og.png');

	function useFallbackImage(event) {
		event.currentTarget.src = '/og.png';
	}
</script>

<a class="card card-hover sub" class:compact href={`/writing/${submission.id}`}>
	<div class="preview" aria-hidden="true">
		<img src={image} alt="" loading="lazy" decoding="async" onerror={useFallbackImage} />
	</div>
	<div class="content">
		<div class="top">
			<span class="chip chip-accent"
				>{submission.content_type_label ?? submission.content_type}</span
			>
			{#if submission.status === 'featured'}
				<span class="pill pill-amber">★ Featured</span>
			{/if}
		</div>
		<h3>{submission.title}</h3>
		{#if submission.summary}
			<p class="summary">{submission.summary}</p>
		{/if}
		<div class="foot">
			{#if submission.author}
				<span class="by muted">by {submission.author.display_name ?? submission.author}</span>
			{/if}
			<span class="read">Read →</span>
		</div>
		{#if tags.length}
			<ul class="tag-list">
				{#each tags as t (t)}
					<li class="chip">#{t}</li>
				{/each}
			</ul>
		{/if}
	</div>
</a>

<style>
	.sub {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		text-decoration: none;
		color: inherit;
		height: 100%;
	}
	.sub:hover {
		text-decoration: none;
	}
	.content {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		flex: 1;
		min-width: 0;
	}
	/* Default (banner) preview: full-width image on top, bleeding to the card edges. */
	.preview {
		aspect-ratio: 1200 / 630;
		margin: -1.4rem -1.4rem 0;
		overflow: hidden;
		border-radius: var(--radius) var(--radius) 0 0;
		border-bottom: 1px solid var(--border);
		background: var(--surface-2);
	}
	.preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.2s ease;
	}
	.sub:hover .preview img {
		transform: scale(1.03);
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	h3 {
		margin: 0;
		font-size: 1.25rem;
		overflow-wrap: anywhere;
	}
	.summary {
		margin: 0;
		color: var(--muted);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
	}
	.read {
		color: var(--accent-strong);
		font-weight: 600;
		font-size: 0.9rem;
		flex-shrink: 0;
	}
	.by {
		font-size: 0.9rem;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Compact: small horizontal card with the image alongside the title. */
	.sub.compact {
		flex-direction: row;
		align-items: stretch;
		gap: 0;
		padding: 0;
		overflow: hidden;
		height: 150px;
	}
	.sub.compact .preview {
		aspect-ratio: auto;
		width: 116px;
		flex-shrink: 0;
		margin: 0;
		border-radius: 0;
		border-bottom: none;
		border-right: 1px solid var(--border);
	}
	.sub.compact .content {
		padding: 0.85rem 1rem;
		gap: 0.35rem;
		overflow: hidden;
	}
	.sub.compact h3 {
		font-size: 1.05rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	/* Keep compact cards tight: drop the summary and tag row. */
	.sub.compact .summary,
	.sub.compact .tag-list {
		display: none;
	}
	@media (max-width: 400px) {
		.sub.compact .preview {
			width: 92px;
		}
	}
</style>
