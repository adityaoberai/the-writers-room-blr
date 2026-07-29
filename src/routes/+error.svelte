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
		<div class="notice">
			<p class="head">— Correction —</p>
			<p class="code">{status}</p>
			<h1>{title}</h1>
			<p class="lead">
				{status === 404
					? 'This page never went to press. The edition you are holding does not carry it.'
					: message}
			</p>
			<div class="actions">
				<a class="btn btn-primary" href="/">Back to the front page</a>
				<a class="btn btn-secondary" href="/directory">Browse the directory</a>
			</div>
		</div>
	</div>
</section>

<style>
	.err {
		max-width: 620px;
		padding-block: 3rem;
	}
	.notice {
		border: 1px solid var(--rule);
		outline: 1px solid var(--rule);
		outline-offset: 3px;
		margin: 3px;
		padding: 2.2rem 1.6rem 2rem;
	}
	.head {
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.26em;
		font-size: 0.74rem;
		color: var(--danger);
		margin: 0 0 0.8rem;
	}
	.code {
		font-size: 4.5rem;
		font-weight: 700;
		color: var(--ink);
		margin: 0;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	h1 {
		margin-top: 0.4rem;
	}
	.lead {
		margin-inline: auto;
		max-width: 44ch;
	}
	.actions {
		display: flex;
		gap: 0.7rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-top: 1.4rem;
	}
</style>
