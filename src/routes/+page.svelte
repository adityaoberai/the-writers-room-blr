<script>
	import Seo from '$lib/components/Seo.svelte';
	import MemberCard from '$lib/components/MemberCard.svelte';
	import SubmissionCard from '$lib/components/SubmissionCard.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import Typewriter from '$lib/components/Typewriter.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import { reveal } from '$lib/actions/reveal.js';
	import { develop } from '$lib/actions/develop.js';

	let { data } = $props();
	const hero = $derived(data.hero);
	const stats = $derived(data.stats ?? { writers: 0, pieces: 0 });
	const siteCopy = $derived(data.siteCopy);
	const featuredMembers = $derived(data.featuredMembers);
	const featuredWriting = $derived(data.featuredWriting);
	const upcomingEvents = $derived(data.upcomingEvents ?? []);
	const user = $derived(data.user);

	const typedWords = [
		'fiction.',
		'journals.',
		'essays.',
		'poetry.',
		'blogs.',
		'newsletters.',
		'research.',
		'your next draft.'
	];

	// One ledger of what the room is and how it runs: the benefits copy carries
	// the format and the house rule too (see the site_settings `benefits` JSON).
	const marks = $derived(siteCopy.benefits ?? []);
</script>

<Seo
	title="The Writers' Room BLR: a focused writing community in Bengaluru"
	description="A writing community for Bengaluru writers to create, connect, and grow together. Join a meetup, build your profile, share your work and earn rewards."
/>

<!-- Above the fold: the lead story -->
<section class="fold-wrap">
	<div class="container fold">
		<div class="lead-story">
			<p class="eyebrow kicker-rule">From the room</p>
			<h1>{hero.title}</h1>
			<p class="typed-line">A focused room for <Typewriter words={typedWords} /></p>
			{#if hero.subtitle}
				<p class="lead">{hero.subtitle}</p>
			{/if}
			<div class="cta-row">
				<a class="btn btn-primary" href={user ? '/submit' : '/signin'}>
					{user ? 'Submit writing' : 'Join the room'}
				</a>
				<a class="btn btn-secondary" href="/writing">Browse the writing</a>
			</div>
			{#if stats.pieces > 0}
				<p class="social-proof byline">
					Join <b>{stats.writers} writer{stats.writers === 1 ? '' : 's'}</b> who&rsquo;ve shared
					<b>{stats.pieces}</b> piece{stats.pieces === 1 ? '' : 's'} so far.
				</p>
			{/if}
		</div>

		<div class="fold-aside">
			<figure class="figure">
				<img class="print-photo" src="/logo.jpg" alt="" width="440" height="440" use:develop />
				<figcaption>The typewriter, emblem of The Writers&rsquo; Room.</figcaption>
			</figure>
		</div>
	</div>
</section>

<!-- The feature spread: the room in pictures, what you get, and how it runs.
     (Photos auto-populate from static/events-gallery.) -->
<section class="section feature" use:reveal>
	<div class="container">
		<div class="sechead-left"><h2>A standing time and place to write.</h2></div>
		{#if siteCopy.mission}
			<p class="deck">{siteCopy.mission}</p>
		{/if}
		<div class="feature-art">
			<Gallery photos={data.galleryPhotos} />
		</div>
		{#if marks.length}
			<div class="wordmarks featmarks">
				{#each marks as b (b.title)}
					<div class="wm"><b>{b.title}</b><span>{b.body}</span></div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Upcoming events as display ads -->
<section class="section" id="events" use:reveal>
	<div class="container">
		<div class="sechead-left">
			<h2>Next meetups</h2>
			<a class="more" href="/events">All events →</a>
		</div>

		{#if upcomingEvents.length}
			<div class="grid grid-3 adrow">
				{#each upcomingEvents as e (e.id)}
					<EventCard event={e} />
				{/each}
			</div>
		{:else}
			<div class="tolet">
				<div class="tolet-head">This space to let</div>
				<p>
					No meetups are scheduled right now - check back soon, or <a href="/events"
						>browse past sessions</a
					>.
				</p>
			</div>
		{/if}
	</div>
</section>

<!-- Featured members as a people column -->
{#if featuredMembers?.length}
	<section class="section" use:reveal>
		<div class="container">
			<div class="sechead-left">
				<h2>Featured members</h2>
				<a class="more" href="/directory">Browse the directory →</a>
			</div>
			<div class="people">
				{#each featuredMembers as m (m.profile_id)}
					<MemberCard member={{ ...m, display_name: m.display_name }} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Featured writing as classifieds -->
{#if featuredWriting?.length}
	<section class="section" use:reveal>
		<div class="container">
			<div class="sechead-left">
				<h2>Featured writing</h2>
				<a class="more" href="/writing">All writing →</a>
			</div>
			<div class="classifieds">
				{#each featuredWriting as s (s.id)}
					<SubmissionCard submission={s} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Final notice -->
{#if !user}
	<section class="section" use:reveal>
		<div class="container">
			<div class="adbox-double closing">
				<h2>Bring your writing. We&rsquo;ll bring the room.</h2>
				<p>Join free, build your profile, and reserve a spot at the next meetup.</p>
				<a class="btn btn-primary" href="/signin">Join The Writers&rsquo; Room</a>
			</div>
		</div>
	</section>
{/if}

<style>
	.fold {
		display: grid;
		/* minmax(0, …) so the aside's 440px plate can't blow the track out
		   past the viewport on small screens. */
		grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
		gap: 0 1.6rem;
		padding-block: clamp(1.6rem, 4vw, 2.6rem);
	}
	.lead-story {
		padding-right: 1.6rem;
		border-right: 1px solid var(--hairline);
	}
	.kicker-rule {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.kicker-rule::after {
		content: '';
		flex: 0 0 2.5rem;
		border-top: 1px solid var(--rule);
	}
	h1 {
		font-size: clamp(2.2rem, 5.4vw, 3.2rem);
		margin-bottom: 0.35rem;
	}
	.typed-line {
		font-style: italic;
		font-size: clamp(1.1rem, 2.2vw, 1.4rem);
		color: var(--ink);
		margin: 0 0 0.6rem;
		min-height: 1.5em;
	}
	.lead {
		max-width: 52ch;
		margin-bottom: 0;
	}
	.cta-row {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
		margin-top: 1.2rem;
	}
	.social-proof {
		margin: 1rem 0 0;
		font-size: 0.98rem;
	}
	/* A true square plate with its caption tight beneath it. */
	.fold-aside img {
		width: 100%;
		height: auto;
		aspect-ratio: 1 / 1;
		object-fit: cover;
	}
	.fold-aside figcaption {
		border-top: none;
	}
	/* One feature: the room in a line, the artwork, then the ledger of marks.
	   The deck runs the full measure, like the other page leads. */
	.deck {
		margin: -0.4rem 0 1.4rem;
		font-size: 1.02rem;
	}
	.feature-art {
		margin-bottom: 1.6rem;
	}
	.featmarks .wm {
		flex: 1 1 14rem;
	}
	@media (max-width: 600px) {
		/* Keep the mobile ledger compact without losing any of its four promises. */
		.feature {
			padding-block: 1.5rem;
		}
		.deck {
			margin-bottom: 1.15rem;
		}
		.feature-art {
			margin-bottom: 1rem;
		}
		.featmarks .wm {
			flex-basis: auto;
			padding: 0.6rem 1rem;
		}
		.featmarks .wm + .wm {
			border-top-color: color-mix(in srgb, var(--hairline) 75%, transparent);
		}
		.featmarks .wm b {
			font-size: 1.08rem;
		}
		.featmarks .wm span {
			font-size: 0.82rem;
			line-height: 1.4;
			margin-top: 0.1rem;
		}
	}

	.adrow {
		align-items: stretch;
	}

	.closing {
		text-align: center;
		padding: clamp(1.8rem, 4.5vw, 2.8rem);
	}
	.closing h2 {
		margin-bottom: 0.4rem;
	}
	.closing p {
		font-style: italic;
		color: var(--muted);
		max-width: 46ch;
		margin-inline: auto;
		margin-bottom: 1.3rem;
	}

	@media (max-width: 860px) {
		.fold {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.5rem;
		}
		.lead-story {
			padding-right: 0;
			border-right: none;
		}
	}
</style>
