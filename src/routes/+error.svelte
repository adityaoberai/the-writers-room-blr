<script>
	import { page } from '$app/stores';
	import Seo from '$lib/components/Seo.svelte';

	const status = $derived($page.status);
	const message = $derived($page.error?.message || 'Something went wrong.');
	const title = $derived(status === 404 ? 'Page not found' : 'Something went wrong');
</script>

<Seo {title} description={message} noindex={true} />

<section class="section">
	<div class="container center err">
		<p class="code">{status}</p>
		<h1>{title}</h1>
		<p class="lead muted">{message}</p>
		<div class="actions">
			<a class="btn btn-primary" href="/">Back to home</a>
			<a class="btn btn-secondary" href="/directory">Browse the directory</a>
		</div>
	</div>
</section>

<style>
	.err {
		max-width: 560px;
		padding-block: 4rem;
	}
	.code {
		font-family: var(--font-sans);
		font-size: 4rem;
		font-weight: 700;
		color: var(--accent-2);
		margin: 0;
		line-height: 1;
	}
	.actions {
		display: flex;
		gap: 0.7rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-top: 1.5rem;
	}
</style>
