<script>
	import Seo from '$lib/components/Seo.svelte';
	import { formatDate } from '$lib/format.js';

	let { data } = $props();
	const s = $derived(data.submission);
	const desc = $derived(
		(s.summary || `${s.title}, shared in The Writers' Room BLR.`).slice(0, 160)
	);
	const image = $derived(s.preview_image || '/og.png');

	function useFallbackImage(event) {
		event.currentTarget.src = '/og.png';
	}
</script>

<Seo title={s.title} description={desc} {image} type="article" noindex={!data.isPublic} />

<article class="section">
	<div class="container narrow">
		<a class="back" href="/writing">← All writing</a>

		<div class="meta-row">
			<span class="chip chip-accent">{s.content_type_label}</span>
			{#if s.status === 'featured'}<span class="pill pill-amber">★ Featured</span>{/if}
			{#if !data.isPublic}<span class="pill pill-gray">{s.status}</span>{/if}
			{#if data.isOwner}
				<a class="edit-link" href={`/writing/${s.id}/edit`}>Edit</a>
			{/if}
		</div>

		<h1>{s.title}</h1>

		<p class="byline muted">
			{#if s.author}
				By <a href={`/members/${s.author.profile_id}`}>{s.author.display_name}</a> ·
			{/if}
			{formatDate(s.created_at)}
		</p>

		<img
			class="preview-image"
			src={image}
			alt=""
			width="1200"
			height="630"
			loading="eager"
			decoding="async"
			onerror={useFallbackImage}
		/>

		{#if s.summary}
			<p class="summary">{s.summary}</p>
		{/if}

		{#if s.tags?.length}
			<ul class="tag-list">
				{#each s.tags as t (t)}<li class="chip">#{t}</li>{/each}
			</ul>
		{/if}

		{#if s.external_url}
			<hr />
			<div class="external">
				<a
					class="btn btn-primary"
					href={s.external_url}
					target="_blank"
					rel="noopener noreferrer nofollow"
				>
					Read the full piece ↗
				</a>
			</div>
		{/if}
	</div>
</article>

<style>
	.narrow {
		max-width: 720px;
	}
	.back {
		display: inline-block;
		margin-bottom: 1rem;
		font-weight: 600;
		font-size: 0.9rem;
	}
	.meta-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.6rem;
		flex-wrap: wrap;
	}
	.edit-link {
		margin-left: auto;
		font-weight: 600;
		font-size: 0.9rem;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		margin-bottom: 0.5rem;
	}
	.byline {
		font-size: 0.95rem;
		margin-bottom: 1rem;
		overflow-wrap: anywhere;
	}
	.preview-image {
		aspect-ratio: 1200 / 630;
		width: 100%;
		height: auto;
		object-fit: cover;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--surface-2);
		margin-bottom: 1.3rem;
	}
	.summary {
		font-size: 1.2rem;
		color: var(--muted);
		font-style: italic;
		overflow-wrap: anywhere;
	}
	.external {
		margin-top: 1.5rem;
		text-align: center;
	}
</style>
