<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children, data } = $props();
</script>

<a class="skip-link" href="#main">Skip to content</a>
<Header user={data.user} />
<main id="main">
	{@render children()}
</main>
<Footer />
<Toaster />
