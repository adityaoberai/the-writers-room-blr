<script>
	import Seo from '$lib/components/Seo.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';
	import SubmissionForm from '$lib/components/SubmissionForm.svelte';

	let { data, form } = $props();
	// Prefer the just-submitted values on a failed save, else the saved row.
	const values = $derived(form?.values ?? data.values);
</script>

<Seo title="Edit your writing" description="Edit your piece." noindex={true} />

<section class="section">
	<div class="container narrow">
		<header class="page-head">
			<p class="eyebrow">Edit</p>
			<h1>Edit writing</h1>
			<p class="lead">
				Update the details of your piece. Changes go live immediately.
				<a href={`/writing/${data.id}`}>View the piece →</a>
			</p>
		</header>

		<FormFeedback {form} />

		<SubmissionForm
			types={data.types}
			{values}
			currentImage={data.currentImage}
			submitLabel="Save changes"
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
