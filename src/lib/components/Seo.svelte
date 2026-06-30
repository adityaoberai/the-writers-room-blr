<script>
	import { page } from '$app/stores';
	import { SITE, absoluteUrl } from '$lib/seo.js';

	let {
		title,
		description = SITE.tagline,
		image = '/og.png',
		type = 'website',
		noindex = false
	} = $props();

	const fullTitle = $derived(
		title ? (title.includes(SITE.name) ? title : `${title} · ${SITE.name}`) : SITE.name
	);
	const canonical = $derived(absoluteUrl($page.url.pathname));
	const ogImage = $derived(absoluteUrl(image));
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
	{/if}

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:locale" content={SITE.locale} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>
