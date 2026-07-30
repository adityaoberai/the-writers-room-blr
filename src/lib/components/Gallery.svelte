<script>
	import { reveal } from '$lib/actions/reveal.js';
	import { develop } from '$lib/actions/develop.js';

	// Photo URLs are resolved server-side from static/events-gallery (see
	// $lib/server/gallery.js). The section hides itself when there are none.
	let { photos = [] } = $props();

	let shuffledOrder = $state(null);
	let index = $state(0);
	let paused = $state(false);

	const order = $derived(shuffledOrder ?? photos);
	const count = $derived(order.length);

	// Up to two other plates shown as the contact sheet — they share the main
	// plate's height, so two keeps them at a natural crop.
	const sheet = $derived(
		count > 1
			? Array.from({ length: Math.min(2, count - 1) }, (_, k) => (index + k + 1) % count)
			: []
	);

	// Shuffle on the client so each visit shows photos in a different order.
	// SSR / no-JS keeps the server order, so there is no hydration mismatch.
	$effect(() => {
		const next = [...photos];
		for (let i = next.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[next[i], next[j]] = [next[j], next[i]];
		}
		shuffledOrder = next;
		index = 0;
	});

	function go(i) {
		if (count === 0) return;
		index = ((i % count) + count) % count;
	}

	// Auto-rotate. Re-runs only when count/paused change (the interval's reads of
	// `index` are async, so they aren't tracked as effect dependencies). Skips for
	// a single photo or when reduced motion is requested.
	$effect(() => {
		if (count <= 1 || paused) return;
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (reduce) return;
		const timer = setInterval(() => {
			index = (index + 1) % count;
		}, 5000);
		return () => clearInterval(timer);
	});
</script>

{#if count}
	<section class="section moments reveal" use:reveal aria-label="Moments from the room">
		<div class="container">
			<div class="sechead"><h2>Moments from the room</h2></div>

			<div
				class="spread"
				role="group"
				aria-roledescription="carousel"
				aria-label="Past meetup photos"
				onmouseenter={() => (paused = true)}
				onmouseleave={() => (paused = false)}
				onfocusin={() => (paused = true)}
				onfocusout={() => (paused = false)}
			>
				<figure class="plate-fig">
					<div class="plate" use:develop>
						{#each order as src, i (src)}
							<img
								class="slide print-photo"
								class:active={i === index}
								{src}
								alt={`Past Writers' Room BLR meetup, photo ${i + 1} of ${count}`}
								loading={i === 0 ? 'eager' : 'lazy'}
								aria-hidden={i === index ? undefined : 'true'}
							/>
						{/each}
					</div>
					<figcaption class="capbar">
						<span class="cap">
							The room at work - from a past session. <b>PHOTO: THE WRITERS&rsquo; ROOM</b>
						</span>
						{#if count > 1}
							<span class="plateno">Plate {index + 1} of {count}</span>
							<span class="arrows">
								<button
									class="arr"
									type="button"
									aria-label="Previous photo"
									onclick={() => go(index - 1)}>‹</button
								>
								<button
									class="arr"
									type="button"
									aria-label="Next photo"
									onclick={() => go(index + 1)}>›</button
								>
							</span>
						{/if}
					</figcaption>
				</figure>

				{#if sheet.length}
					<!-- The contact sheet borrows its height from the plate: the wrapper adds
					     no height of its own, and the thumbs split whatever the plate sets. -->
					<div class="contactwrap">
						<div class="contact">
							{#each sheet as i (order[i])}
								<button
									class="thumb"
									type="button"
									onclick={() => go(i)}
									aria-label={`Show photo ${i + 1} of ${count}`}
								>
									<img src={order[i]} alt="" loading="lazy" />
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/if}

<style>
	.moments {
		border-block: 1px solid var(--rule);
		background: var(--paper);
	}
	.spread {
		display: grid;
		grid-template-columns: 2.3fr 1fr;
		gap: 0 1.4rem;
	}
	/* The figure dissolves into the grid so the plate (row 1) and the caption
	   bar (row 2) size their rows independently — the contact sheet then
	   aligns to the plate alone. */
	.plate-fig {
		display: contents;
	}
	.plate {
		grid-area: 1 / 1;
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border: 1px solid var(--rule);
		background: var(--paper-shade);
	}
	.slide {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition:
			opacity 0.8s ease,
			filter 0.6s ease;
	}
	.slide.active {
		opacity: 1;
	}
	/* Each plate develops into color as it takes the frame. (.developed is
	   added at runtime by the develop action, so it needs :global to survive
	   the compiler's unused-selector pruning.) */
	.plate:global(.developed) .slide.active {
		filter: none;
	}
	.capbar {
		grid-area: 2 / 1;
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		border-top: 1px solid var(--rule);
		margin-top: 0.45rem;
		padding-top: 0.35rem;
	}
	.capbar .cap {
		font-size: 0.82rem;
		font-style: italic;
		color: var(--muted);
		flex: 1;
	}
	.capbar .cap b {
		font-style: normal;
		text-transform: uppercase;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
	}
	.plateno {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--muted);
		white-space: nowrap;
	}
	.arrows {
		display: flex;
		gap: 0.35rem;
	}
	.arr {
		width: 26px;
		height: 26px;
		border: 1px solid var(--rule);
		background: var(--paper);
		display: grid;
		place-items: center;
		font-family: var(--serif);
		font-size: 0.95rem;
		line-height: 1;
		color: var(--ink);
		cursor: pointer;
		padding: 0;
	}
	.arr:hover {
		background: var(--ink);
		color: var(--paper);
	}
	.contactwrap {
		grid-area: 1 / 2;
		position: relative;
		min-width: 0;
	}
	.contact {
		position: absolute;
		inset: 0;
		display: grid;
		grid-auto-rows: 1fr;
		gap: 0.7rem;
		min-height: 0;
	}
	.thumb {
		border: 1px solid var(--hairline);
		background: var(--paper);
		padding: 0;
		cursor: pointer;
		display: block;
		min-height: 0;
		overflow: hidden;
	}
	.thumb:hover {
		border-color: var(--rule);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		/* The contact sheet always prints black and white — only the main
		   plate develops into color. */
		filter: grayscale(1) contrast(1.04);
	}
	@media (max-width: 800px) {
		.spread {
			grid-template-columns: 1fr;
		}
		.plate,
		.capbar {
			grid-area: auto;
		}
		/* The arrows drive the carousel on small screens; the contact sheet
		   would only push the page down. */
		.contactwrap {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.slide {
			transition: none;
		}
	}
</style>
