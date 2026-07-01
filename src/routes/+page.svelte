<script>
	import Seo from '$lib/components/Seo.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MemberCard from '$lib/components/MemberCard.svelte';
	import SubmissionCard from '$lib/components/SubmissionCard.svelte';
	import Typewriter from '$lib/components/Typewriter.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import { reveal } from '$lib/actions/reveal.js';

	let { data } = $props();
	const hero = $derived(data.hero);
	const stats = $derived(data.stats ?? { writers: 0, pieces: 0 });
	const siteCopy = $derived(data.siteCopy);
	const featuredMembers = $derived(data.featuredMembers);
	const featuredWriting = $derived(data.featuredWriting);
	const user = $derived(data.user);

	const typedWords = [
		'fiction.',
		'essays.',
		'poetry.',
		'newsletters.',
		'research.',
		'your next draft.'
	];
</script>

<Seo
	title="The Writers' Room BLR: a focused writing community in Bengaluru"
	description="A focused writing community for Bengaluru writers to create, connect, and grow together. Join a meetup, build your profile, share your work and earn rewards."
/>

<!-- Hero -->
<section class="hero">
	<div class="container hero-inner">
		<div class="hero-copy">
			<h1>{hero.title}</h1>
			<p class="typed-line">A focused room for <Typewriter words={typedWords} /></p>
			<p class="lead">{hero.subtitle}</p>
			<div class="cta-row">
				<a class="btn btn-primary" href={user ? '/submit' : '/signin'}>
					{user ? 'Submit writing' : 'Join the room'}
				</a>
			</div>
			{#if stats.pieces > 0}
				<p class="social-proof">
					Join {stats.writers} writer{stats.writers === 1 ? '' : 's'} who've shared
					<strong>{stats.pieces}</strong> piece{stats.pieces === 1 ? '' : 's'} so far.
				</p>
			{/if}
			<dl class="stats">
				<div>
					<dt>3 hrs</dt>
					<dd>of focused writing per session</dd>
				</div>
				<div>
					<dt>All genres</dt>
					<dd>fiction, essays, newsletters, research</dd>
				</div>
				<div>
					<dt>Phones down</dt>
					<dd>calm, distraction-free rooms</dd>
				</div>
			</dl>
		</div>

		<div class="hero-art" aria-hidden="true">
			<div class="art-frame">
				<img src="/logo.jpg" alt="" width="440" height="440" />
			</div>
		</div>
	</div>
</section>

<!-- Moments from past meetups (auto-populates from static/events-gallery) -->
<Gallery photos={data.galleryPhotos} />

<!-- Mission / description -->
<section class="section mission" use:reveal>
	<div class="container">
		<p class="eyebrow">What this is</p>
		<h2>A standing time and place to do the work.</h2>
		<p class="lead">{siteCopy.mission}</p>

		<div class="format-grid">
			<div class="format-item">
				<span class="fmt-num">3 hrs</span>
				<span class="muted">Focus time for writing</span>
			</div>
			<div class="format-item">
				<span class="fmt-num">30 mins</span>
				<span class="muted">Show-and-tell</span>
			</div>
		</div>

		{#if siteCopy.meetup_format}
			<div class="card format">
				<Icon name="pen" size={22} />
				<p>{siteCopy.meetup_format}</p>
			</div>
		{/if}
		{#if siteCopy.meetup_note}
			<div class="card note">
				<strong>Work first, network second.</strong>
				<p>{siteCopy.meetup_note}</p>
			</div>
		{/if}
		{#if siteCopy.readers_room}
			<div class="card readers">
				<span class="readers-icon"><Icon name="book" size={20} /></span>
				<div>
					<strong>Every 5th meetup is a Readers' Room.</strong>
					<p>{siteCopy.readers_room}</p>
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- Benefits -->
{#if siteCopy.benefits?.length}
	<section class="section benefits" use:reveal>
		<div class="container">
			<p class="eyebrow">Why join</p>
			<h2>Everything you need to keep writing.</h2>
			<div class="grid grid-4">
				{#each siteCopy.benefits as b (b.title)}
					<div class="card benefit">
						<span class="benefit-icon"><Icon name={b.icon || 'star'} size={22} /></span>
						<h3>{b.title}</h3>
						<p class="muted">{b.body}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Events + Luma -->
<section class="section" id="events" use:reveal>
	<div class="container">
		<div class="section-head">
			<div>
				<p class="eyebrow">Upcoming</p>
				<h2>Next meetups</h2>
			</div>
			<a class="btn btn-secondary btn-sm" href="/events">All events</a>
		</div>

		{#if siteCopy.luma_embed_url}
			<div class="luma-embed">
				<iframe
					src={siteCopy.luma_embed_url}
					title="The Writers' Room BLR events on Luma"
					loading="lazy"
					allowfullscreen
				></iframe>
			</div>
		{/if}
	</div>
</section>

<!-- Featured members -->
{#if featuredMembers?.length}
	<section class="section benefits" use:reveal>
		<div class="container">
			<div class="section-head">
				<div>
					<p class="eyebrow">Community</p>
					<h2>Featured members</h2>
				</div>
				<a class="btn btn-secondary btn-sm" href="/directory">Browse directory</a>
			</div>
			<div class="grid grid-3">
				{#each featuredMembers as m (m.profile_id)}
					<MemberCard member={{ ...m, display_name: m.display_name }} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Featured writing -->
{#if featuredWriting?.length}
	<section class="section" use:reveal>
		<div class="container">
			<div class="section-head">
				<div>
					<p class="eyebrow">From the room</p>
					<h2>Featured writing</h2>
				</div>
				<a class="btn btn-secondary btn-sm" href="/writing">All writing</a>
			</div>
			<div class="grid grid-3">
				{#each featuredWriting as s (s.id)}
					<SubmissionCard submission={s} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Final CTA -->
<section class="section" use:reveal>
	<div class="container">
		<div class="cta-band">
			<h2>Bring your writing. We'll bring the room.</h2>
			<p>Join free, build your profile, and reserve a spot at the next meetup.</p>
			<a class="btn btn-primary" href="/signin">Join The Writers' Room BLR</a>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		overflow: hidden;
		border-bottom: 1px solid var(--border);
		background:
			radial-gradient(900px 380px at 88% -10%, rgba(47, 111, 176, 0.16), transparent),
			repeating-linear-gradient(
				180deg,
				transparent,
				transparent 31px,
				rgba(15, 23, 42, 0.035) 32px
			),
			linear-gradient(180deg, #fffdf8, var(--bg));
	}
	.hero-inner {
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		gap: 2.5rem;
		align-items: center;
		padding-block: clamp(3rem, 7vw, 5.5rem);
	}
	.hero-copy {
		max-width: 640px;
	}
	.hero h1 {
		font-size: clamp(2.6rem, 6vw, 4rem);
		margin-bottom: 0.4rem;
	}
	.typed-line {
		font-family: var(--font-sans);
		font-size: clamp(1.3rem, 2.6vw, 1.9rem);
		color: var(--navy);
		margin: 0 0 0.9rem;
		min-height: 1.5em;
	}
	.cta-row {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
		margin-top: 1.5rem;
	}
	.social-proof {
		margin: 1.1rem 0 0;
		color: var(--muted);
	}
	.social-proof strong {
		color: var(--accent-strong);
	}
	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		margin: 2rem 0 0;
		padding: 0;
	}
	.stats div {
		margin: 0;
	}
	.stats dt {
		font-family: var(--font-sans);
		font-size: 1.5rem;
		color: var(--navy);
		font-weight: 700;
	}
	.stats dd {
		margin: 0.1rem 0 0;
		color: var(--muted);
		font-size: 0.92rem;
		max-width: 18ch;
	}
	.hero-art {
		display: flex;
		justify-content: center;
	}
	.art-frame {
		width: min(100%, 440px);
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
		background: var(--surface);
	}
	.art-frame img {
		width: 100%;
		height: auto;
		display: block;
	}

	.mission .lead {
		max-width: 64ch;
	}
	.format-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 1.75rem;
	}
	@media (max-width: 560px) {
		.format-grid {
			grid-template-columns: 1fr;
		}
	}
	.format-item {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.fmt-num {
		font-family: var(--font-sans);
		font-size: 1.9rem;
		font-weight: 700;
		color: var(--accent-strong);
		line-height: 1;
	}
	.format {
		display: flex;
		gap: 0.8rem;
		align-items: flex-start;
		margin-top: 1rem;
		color: var(--accent-strong);
	}
	.format p {
		margin: 0;
		color: var(--text);
	}
	.note {
		margin-top: 1rem;
		border-color: #fcd9a6;
		background: #fffaf0;
	}
	.note strong {
		display: block;
		margin-bottom: 0.3rem;
		color: #92400e;
	}
	.note p {
		margin: 0;
		color: var(--text);
	}
	.readers {
		margin-top: 1rem;
		display: flex;
		gap: 0.8rem;
		align-items: flex-start;
		border-color: #cfe0f0;
		background: #eaf1f9;
	}
	.readers-icon {
		color: var(--accent-strong);
		margin-top: 2px;
		flex-shrink: 0;
	}
	.readers strong {
		display: block;
		margin-bottom: 0.3rem;
		color: var(--accent-strong);
	}
	.readers p {
		margin: 0;
		color: var(--text);
	}
	.benefits {
		background: var(--surface-2);
		border-block: 1px solid var(--border);
	}
	.benefit {
		height: 100%;
	}
	.benefit-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: #eaf1f9;
		color: var(--accent-strong);
		margin-bottom: 0.8rem;
	}
	.benefit h3 {
		margin: 0 0 0.3rem;
		font-size: 1.1rem;
	}
	.section-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}
	.section-head h2 {
		margin: 0;
	}
	.luma-embed {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--surface);
		box-shadow: var(--shadow-sm);
	}
	.luma-embed iframe {
		width: 100%;
		height: 600px;
		border: 0;
		display: block;
	}
	.cta-band {
		background: linear-gradient(135deg, var(--navy), #16335f);
		color: #fff;
		border-radius: var(--radius-lg);
		padding: clamp(2rem, 5vw, 3.5rem);
		text-align: center;
	}
	.cta-band h2 {
		color: #fff;
	}
	.cta-band p {
		color: #cbd5e1;
		max-width: 46ch;
		margin-inline: auto;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 860px) {
		.hero-inner {
			grid-template-columns: 1fr;
			gap: 1.75rem;
		}
		.art-frame {
			width: min(100%, 360px);
		}
	}
</style>
