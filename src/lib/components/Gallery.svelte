<script>
	import { reveal } from '$lib/actions/reveal.js';

	// Photo URLs are resolved server-side from static/events-gallery (see
	// $lib/server/gallery.js). The section hides itself when there are none.
	let { photos = [] } = $props();

	let shuffledOrder = $state(null);
	let index = $state(0);
	let paused = $state(false);

	const order = $derived(shuffledOrder ?? photos);
	const count = $derived(order.length);

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
	<section class="section moments reveal" use:reveal aria-label="Moments from past meetups">
		<div class="container">
			<p class="eyebrow">From past meetups</p>
			<h2>Moments from the room</h2>

			<div
				class="carousel"
				role="group"
				aria-roledescription="carousel"
				aria-label="Past meetup photos"
				onmouseenter={() => (paused = true)}
				onmouseleave={() => (paused = false)}
				onfocusin={() => (paused = true)}
				onfocusout={() => (paused = false)}
			>
				<div class="frame">
					{#each order as src, i (src)}
						<img
							class="slide"
							class:active={i === index}
							{src}
							alt={`Past Writers' Room BLR meetup, photo ${i + 1} of ${count}`}
							loading={i === 0 ? 'eager' : 'lazy'}
							aria-hidden={i === index ? undefined : 'true'}
						/>
					{/each}

					{#if count > 1}
						<button
							class="nav prev"
							type="button"
							aria-label="Previous photo"
							onclick={() => go(index - 1)}
						>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"
								><path
									d="M15 6l-6 6 6 6"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/></svg
							>
						</button>
						<button
							class="nav next"
							type="button"
							aria-label="Next photo"
							onclick={() => go(index + 1)}
						>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"
								><path
									d="M9 6l6 6-6 6"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/></svg
							>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</section>
{/if}

<style>
	.moments {
		background: var(--surface-2);
		border-block: 1px solid var(--border);
	}
	.carousel {
		margin-top: 1.5rem;
		max-width: 960px;
	}
	.frame {
		position: relative;
		aspect-ratio: 16 / 9;
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--border);
		box-shadow: var(--shadow);
		background: var(--navy);
	}
	.slide {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.8s ease;
	}
	.slide.active {
		opacity: 1;
	}
	.nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 999px;
		border: none;
		background: rgba(255, 255, 255, 0.86);
		color: var(--navy);
		cursor: pointer;
		box-shadow: var(--shadow-sm);
	}
	.nav:hover {
		background: #fff;
	}
	.prev {
		left: 0.8rem;
	}
	.next {
		right: 0.8rem;
	}
	@media (prefers-reduced-motion: reduce) {
		.slide {
			transition: none;
		}
	}
</style>
