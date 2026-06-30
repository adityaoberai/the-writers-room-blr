<script>
	let { submission } = $props();
	const tags = $derived((submission.tags ?? []).slice(0, 3));
	const image = $derived(submission.preview_image || '/og.png');

	function useFallbackImage(event) {
		event.currentTarget.src = '/og.png';
	}
</script>

<a class="card card-hover sub" href={`/writing/${submission.id}`}>
	<div class="preview" aria-hidden="true">
		<img src={image} alt="" loading="lazy" decoding="async" onerror={useFallbackImage} />
	</div>
	<div class="top">
		<span class="chip chip-accent">{submission.content_type_label ?? submission.content_type}</span>
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
</style>
