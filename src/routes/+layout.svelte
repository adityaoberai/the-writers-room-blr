<script>
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children, data } = $props();

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
