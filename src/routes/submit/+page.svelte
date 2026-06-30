<script>
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';

	let { data, form } = $props();
	const v = $derived(form?.values ?? {});
	let submitting = $state(false);

	const onSubmit = () => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	};
</script>

<Seo
	title="Submit your writing"
	description="Share a blog, essay, excerpt, newsletter or research piece with The Writers' Room BLR."
	noindex={true}
/>

<section class="section">
	<div class="container narrow">
		<header class="page-head">
			<p class="eyebrow">Share your work</p>
			<h1>Submit writing</h1>
			<p class="lead">
				Paste your piece or link to it. Submissions are reviewed before appearing publicly, and you
				earn points for sharing.
			</p>
		</header>

		<FormFeedback {form} />

		<form method="POST" use:enhance={onSubmit} class="card form">
			<div class="field">
				<label for="title">Title</label>
				<input id="title" name="title" type="text" maxlength="256" required value={v.title ?? ''} />
			</div>

			<div class="row">
				<div class="field">
					<label for="content_type">Type</label>
					<select id="content_type" name="content_type">
						{#each data.types as t (t.key)}
							<option value={t.key} selected={v.content_type === t.key}>{t.label}</option>
						{/each}
					</select>
				</div>
				<div class="field">
					<label for="tags">Tags</label>
					<input
						id="tags"
						name="tags"
						type="text"
						placeholder="poetry, bengaluru, monsoon"
						value={v.tags ?? ''}
					/>
				</div>
			</div>

			<div class="field">
				<label for="summary">Summary</label>
				<textarea
					id="summary"
					name="summary"
					rows="2"
					maxlength="1024"
					placeholder="A one or two line abstract.">{v.summary ?? ''}</textarea
				>
			</div>

			<div class="field">
				<label for="body">Full text</label>
				<textarea id="body" name="body" rows="12" placeholder="Paste your writing here…"
					>{v.body ?? ''}</textarea
				>
				<p class="hint">Plain text. Optional if you add a link below.</p>
			</div>

			<div class="divider-label">and / or a link</div>

			<div class="field">
				<label for="external_url">External link</label>
				<input
					id="external_url"
					name="external_url"
					type="url"
					placeholder="https://yourblog.com/post"
					value={v.external_url ?? ''}
				/>
				<p class="hint">You can add written text, a link, or both, whatever fits your piece.</p>
			</div>

			<button class="btn btn-primary" type="submit" disabled={submitting}>
				{submitting ? 'Submitting…' : 'Submit for review'}
			</button>
		</form>
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
	.form {
		padding: 1.6rem;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 520px) {
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>
