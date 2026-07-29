<script>
	import Seo from '$lib/components/Seo.svelte';
	import MemberCard from '$lib/components/MemberCard.svelte';
	import SubmissionCard from '$lib/components/SubmissionCard.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import Typewriter from '$lib/components/Typewriter.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import { reveal } from '$lib/actions/reveal.js';

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

<!-- Above the fold: the lead story -->
<section class="fold-wrap">
	<div class="container fold">
		<div class="lead-story">
			<p class="eyebrow kicker-rule">From the room</p>
			<h1>{hero.title}</h1>
			<p class="typed-line">A focused room for <Typewriter words={typedWords} /></p>
			<p class="lead">{hero.subtitle}</p>
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
			<div class="wordmarks marks">
				<div class="wm"><b>3 hrs</b><span>of focused writing per session</span></div>
				<div class="wm"><b>All genres</b><span>fiction, essays, newsletters, research</span></div>
				<div class="wm"><b>Phones down</b><span>calm, distraction-free rooms</span></div>
			</div>
		</div>

		<div class="fold-aside">
			<figure class="figure">
				<img class="print-photo" src="/logo.jpg" alt="" width="440" height="440" />
				<figcaption>
					The room&rsquo;s plate — laptops, notebooks and the occasional typewriter.
					<b>THE WRITERS&rsquo; ROOM</b>
				</figcaption>
			</figure>
			{#if siteCopy.readers_room}
				<div class="sidebox">
					<span class="rev">Readers&rsquo; Room</span>
					<p class="j">{siteCopy.readers_room}</p>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Moments from past meetups (auto-populates from static/events-gallery) -->
<Gallery photos={data.galleryPhotos} />

<!-- Mission, set in columns below the fold -->
<section class="section" use:reveal>
	<div class="container">
		<div class="sechead-left"><h2>A standing time and place to do the work.</h2></div>
		<div class="below">
			<div class="blk">
				<h4>The room</h4>
				<p>{siteCopy.mission}</p>
			</div>
			{#if siteCopy.meetup_format}
				<div class="blk">
					<h4>The format</h4>
					<p>{siteCopy.meetup_format}</p>
				</div>
			{/if}
			{#if siteCopy.meetup_note}
				<div class="blk">
					<h4>Work first, <b>network second.</b></h4>
					<p>{siteCopy.meetup_note}</p>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Benefits as word-marks -->
{#if siteCopy.benefits?.length}
	<section class="section benefits" use:reveal>
		<div class="container">
			<div class="sechead"><h2>Everything you need to keep writing.</h2></div>
			<div class="wordmarks">
				{#each siteCopy.benefits as b (b.title)}
					<div class="wm"><b>{b.title}</b><span>{b.body}</span></div>
				{/each}
			</div>
		</div>
	</section>
{/if}

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
					No meetups are scheduled right now — check back soon, or <a href="/events"
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
	.fold-wrap {
		border-bottom: 3px solid var(--rule);
	}
	.fold {
		display: grid;
		grid-template-columns: 1.9fr 1fr;
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
	.marks {
		margin-top: 1.3rem;
	}
	.fold-aside {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}
	.fold-aside img {
		width: 100%;
		height: auto;
	}
	.sidebox {
		border: 1px solid var(--rule);
		padding: 0.75rem 0.9rem;
	}
	.sidebox p {
		margin: 0.5rem 0 0;
		font-size: 0.88rem;
	}

	.below {
		column-count: 3;
		column-gap: 1.6rem;
		column-rule: 1px solid var(--hairline);
	}
	.blk {
		break-inside: avoid;
		margin-bottom: 0.8rem;
	}
	.blk h4 {
		margin: 0 0 0.25rem;
		font-size: 1rem;
	}
	.blk p {
		margin: 0;
		font-size: 0.94rem;
		text-align: justify;
		hyphens: auto;
		-webkit-hyphens: auto;
	}

	.benefits {
		background: var(--paper-shade);
		border-block: 1px solid var(--rule);
	}
	.benefits .wm {
		flex: 1 1 14rem;
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
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		.lead-story {
			padding-right: 0;
			border-right: none;
		}
		.below {
			column-count: 1;
		}
	}
</style>
