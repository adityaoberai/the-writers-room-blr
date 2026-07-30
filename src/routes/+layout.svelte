<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children, data } = $props();

	// Opening: the paper unfolds once per session, then never again.
	let unfolding = $state(false);
	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!reduced && !sessionStorage.getItem('twr-opened')) {
			sessionStorage.setItem('twr-opened', '1');
			unfolding = true;
			setTimeout(() => (unfolding = false), 2100);
		}
	});

	// Subpage moves turn the page (View Transitions; browsers without it just navigate).
	// Leaving a member record for the directory turns the page back the other way.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const backToDirectory =
			navigation.from?.route?.id === '/members/[id]' && navigation.to?.route?.id === '/directory';
		if (backToDirectory) document.documentElement.setAttribute('data-turn', 'back');
		return new Promise((resolve) => {
			const transition = document.startViewTransition(() => {
				resolve();
				return navigation.complete;
			});
			transition.finished.finally(() => document.documentElement.removeAttribute('data-turn'));
		});
	});
</script>

<a class="skip-link" href="#main">Skip to content</a>
<Header user={data.user} />
<main id="main">
	{@render children()}
</main>
<Footer user={data.user} />
<Toaster />

{#if unfolding}
	<div class="unfold" aria-hidden="true">
		<div class="uo-stage">
			<div class="uo-sheet">
				<div class="uo-top">
					<div class="uo-dateline">
						<span>Vol. II</span><span>Bengaluru, India</span><span>Free for members</span>
					</div>
					<div class="uo-brand">The Writers&rsquo; Room BLR</div>
					<div class="uo-dbl"></div>
				</div>
				<div class="uo-flap">
					<div class="uo-face uo-front">
						<div class="uo-cols">
							<span class="uo-greek"></span><span class="uo-greek"></span><span class="uo-greek"
							></span>
						</div>
					</div>
					<div class="uo-face uo-back"></div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.unfold {
		position: fixed;
		inset: 0;
		z-index: 11000;
		display: grid;
		place-items: center;
		background: var(--paper);
		animation: uo-lift 2.1s ease forwards;
	}
	.uo-stage {
		perspective: 1500px;
		width: min(560px, 86vw);
	}
	.uo-sheet {
		box-shadow: 0 18px 40px rgba(27, 24, 18, 0.25);
	}
	.uo-top {
		background: var(--paper);
		border: 1px solid rgba(27, 24, 18, 0.3);
		border-bottom: none;
		padding: 0.9rem 1.2rem 0.5rem;
	}
	.uo-dateline {
		display: flex;
		justify-content: space-between;
		font-size: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
		border-bottom: 1px solid var(--rule);
		padding-bottom: 0.2rem;
	}
	.uo-brand {
		text-align: center;
		font-weight: 700;
		font-size: 1.8rem;
		letter-spacing: -0.015em;
		padding: 0.45rem 0 0.4rem;
	}
	.uo-dbl {
		border-top: 3px double var(--rule);
	}
	.uo-flap {
		transform-origin: 50% 0;
		transform-style: preserve-3d;
		position: relative;
		animation: uo-unfold 1.5s cubic-bezier(0.35, 0, 0.22, 1) forwards;
	}
	.uo-face {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}
	.uo-front {
		background: var(--paper);
		border: 1px solid rgba(27, 24, 18, 0.3);
		border-top: none;
		padding: 0.7rem 1.2rem 1.1rem;
	}
	.uo-back {
		position: absolute;
		inset: 0;
		transform: rotateX(180deg);
		background: var(--paper);
		border: 1px solid rgba(27, 24, 18, 0.3);
		background-image: repeating-linear-gradient(
			180deg,
			rgba(27, 24, 18, 0.05) 0 2px,
			transparent 2px 7px
		);
	}
	.uo-cols {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.9rem;
	}
	.uo-greek {
		height: 64px;
		background: repeating-linear-gradient(180deg, rgba(27, 24, 18, 0.3) 0 2px, transparent 2px 7px);
	}
	@keyframes uo-unfold {
		0%,
		14% {
			transform: rotateX(-179.5deg);
		}
		62% {
			transform: rotateX(5deg);
		}
		78%,
		100% {
			transform: rotateX(0);
		}
	}
	@keyframes uo-lift {
		0%,
		78% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
