<script>
	import Seo from '$lib/components/Seo.svelte';
	import { formatDate } from '$lib/format.js';

	let { data } = $props();
	const s = $derived(data.submission);
	const desc = $derived(
		(s.summary || `${s.title}, shared in The Writers' Room BLR.`).slice(0, 160)
	);
	const image = $derived(s.preview_image || '/og.png');
	const credit = $derived(
		s.author?.display_name ? s.author.display_name.toUpperCase() : "THE WRITERS' ROOM"
	);

	function useFallbackImage(event) {
		event.currentTarget.src = '/og.png';
	}
</script>

<Seo title={s.title} description={desc} {image} type="article" noindex={!data.isPublic} />

<article class="section">
	<div class="container narrow">
		<a class="back" href="/writing">← All writing</a>

		<div class="meta-row">
			<span class="chip">{s.content_type_label}</span>
			{#if s.status === 'featured'}<span class="stamp st-featured">★ Featured</span>{/if}
			{#if !data.isPublic}<span class="stamp st-pending">{s.status}</span>{/if}
			{#if data.isOwner}
				<a class="edit-link" href={`/writing/${s.id}/edit`}>Edit</a>
			{/if}
		</div>

		<h1>{s.title}</h1>

		<p class="byline story-byline">
			{#if s.author}
				By <a href={`/members/${s.author.profile_id}`}>{s.author.display_name}</a> ·
			{/if}
			{formatDate(s.created_at)}
		</p>

		<figure class="figure">
			<img
				class="print-photo"
				src={image}
				alt=""
				width="1200"
				height="630"
				loading="eager"
				decoding="async"
				onerror={useFallbackImage}
			/>
			<figcaption>
				Cover plate for &ldquo;{s.title}&rdquo;. <b>PLATE: {credit}</b>
			</figcaption>
		</figure>

		{#if s.summary}
			<p class="summary lead j">{s.summary}</p>
		{/if}

		{#if s.tags?.length}
			<p class="hashes">{s.tags.map((t) => `#${t}`).join('  ')}</p>
		{/if}

		{#if s.external_url}
			<div class="dinkus" aria-hidden="true">***</div>
			<div class="external">
				<p class="continues">This piece continues off the page.</p>
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
		font-size: 0.9rem;
	}
	.meta-row {
		display: flex;
		gap: 0.7rem;
		align-items: center;
		margin-bottom: 0.7rem;
		flex-wrap: wrap;
	}
	.edit-link {
		margin-left: auto;
		font-weight: 700;
		font-size: 0.9rem;
	}
	h1 {
		font-size: clamp(1.9rem, 4.8vw, 2.8rem);
		margin-bottom: 0.35rem;
	}
	.story-byline {
		font-size: 0.98rem;
		margin: 0 0 1rem;
		overflow-wrap: anywhere;
		border-bottom: 1px solid var(--rule);
		padding-bottom: 0.7rem;
	}
	.figure {
		margin-bottom: 1.2rem;
	}
	.figure img {
		aspect-ratio: 1200 / 630;
		width: 100%;
		height: auto;
		object-fit: cover;
		background: var(--paper-shade);
	}
	.summary {
		font-size: 1.18rem;
		overflow-wrap: anywhere;
	}
	.hashes {
		font-size: 0.85rem;
		color: var(--muted);
	}
	.external {
		text-align: center;
		margin-bottom: 0.5rem;
	}
	.continues {
		font-style: italic;
		color: var(--muted);
		font-size: 0.9rem;
		margin-bottom: 0.9rem;
	}
</style>
