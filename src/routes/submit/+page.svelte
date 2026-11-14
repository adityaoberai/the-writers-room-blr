<script>
	import Seo from '$lib/components/Seo.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';
	import SubmissionForm from '$lib/components/SubmissionForm.svelte';

	let { data, form } = $props();
	const values = $derived(form?.values ?? {});
</script>

<Seo
	title="Submit your writing"
	description="Share a blog, essay, excerpt, newsletter or research piece with The Writers' Room BLR."
	noindex={true}
/>

<section class="section">
	<div class="container narrow">
		<header class="page-head">
			<h1>Submit writing</h1>
			<p class="lead">
				Paste a link to import its title, summary and cover image, or enter the details yourself. An
				admin will review your piece before it appears in the community writing feed.
			</p>
		</header>

		<FormFeedback {form} />

		<SubmissionForm
			types={data.types}
			{values}
			preview={form?.preview}
			fromLink
			submitLabel="Submit for review"
		/>
	</div>
</section>

<style>
	.narrow {
		max-width: 720px;
	}
	.page-head {
		margin-bottom: 1.5rem;
	}
	.page-head h1 {
		margin-bottom: 0.4rem;
	}
</style>
