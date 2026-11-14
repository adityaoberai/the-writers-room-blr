<script>
	import { enhance } from '$app/forms';
	import { develop } from '$lib/actions/develop.js';

	let {
		types = [],
		values = {},
		currentImage = '',
		submitLabel = 'Publish',
		fromLink = false,
		preview = null
	} = $props();

	let pending = $state('');
	let imageName = $state('');
	let details = $state();
	let title = $derived(values.title ?? '');
	let summary = $derived(values.summary ?? '');
	let contentType = $derived(values.content_type ?? '');
	let externalUrl = $derived(values.external_url ?? '');
	const matchingPreview = $derived(externalUrl.trim() === values.external_url ? preview : null);
	const cover = $derived(currentImage || (!imageName ? matchingPreview?.imageUrl : ''));

	function changeLink(event) {
		const nextUrl = event.currentTarget.value;
		if (matchingPreview && nextUrl.trim() !== values.external_url) {
			if (title === matchingPreview.title) title = '';
			if (summary === matchingPreview.summary) summary = '';
			if (contentType === matchingPreview.contentType) contentType = '';
		}
		externalUrl = nextUrl;
	}

	const onSubmit = ({ formData, cancel }) => {
		if (pending) {
			cancel();
			return;
		}
		const previewing = formData.get('intent') === 'preview';
		if (previewing) formData.delete('image');
		pending = previewing ? 'preview' : 'submit';
		return async ({ result, update }) => {
			try {
				await update(previewing ? { reset: false, invalidateAll: false } : undefined);
				if (details && (result.type === 'success' || result.type === 'failure')) {
					details.open = true;
				}
			} finally {
				pending = '';
			}
		};
	};
</script>

{#snippet linkField()}
	<div class="field">
		<label for="external_url">Link <span class="optional">- optional</span></label>
		<input
			id="external_url"
			name="external_url"
			type="url"
			maxlength="2048"
			placeholder="https://yourblog.com/post"
			value={externalUrl}
			oninput={changeLink}
		/>
	</div>
{/snippet}

{#snippet writingFields()}
	<div>
		<div class="field">
			<label for="title">Title</label>
			<input
				id="title"
				name="title"
				type="text"
				maxlength="256"
				required={!fromLink}
				bind:value={title}
			/>
		</div>

		<div class="cols2">
			<div class="field">
				<label for="content_type">Type</label>
				<select id="content_type" name="content_type" required={!fromLink} bind:value={contentType}>
					{#if fromLink}
						<option value="">Automatic</option>
					{/if}
					{#each types as t (t.key)}
						<option value={t.key}>{t.label}</option>
					{/each}
				</select>
			</div>

			{#if !fromLink}
				{@render linkField()}
			{/if}
		</div>

		<div class="field">
			<label for="summary">Summary <span class="optional">- optional</span></label>
			<textarea
				id="summary"
				name="summary"
				rows="2"
				maxlength="1024"
				placeholder="A one or two line abstract."
				bind:value={summary}></textarea>
		</div>

		<div class="field" style="margin-bottom:0">
			<label for="image">Cover image <span class="optional">- optional</span></label>
			{#if cover}
				<img
					class="current-cover print-photo"
					src={cover}
					alt={currentImage ? 'Current cover' : 'Cover from the linked page'}
					referrerpolicy="no-referrer"
					use:develop
				/>
			{/if}
			<label class="file-btn">
				<input
					id="image"
					type="file"
					name="image"
					accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
					onchange={(e) => (imageName = e.currentTarget.files?.[0]?.name ?? '')}
				/>
				<span
					>Affix an image here - <b>{imageName || (cover ? 'replace the file' : 'choose a file')}</b
					></span
				>
			</label>
			<p class="hint">
				JPG, PNG, WEBP, AVIF or GIF up to 100MB. Upload a file to override the image from your link.
			</p>
		</div>
	</div>
{/snippet}

<form
	method="POST"
	enctype="multipart/form-data"
	use:enhance={onSubmit}
	class="paperform"
	aria-busy={Boolean(pending)}
>
	<div class="pf-bar">
		<span>Form 7 - Submission slip</span><span>The Writers&rsquo; Room BLR</span>
	</div>

	<fieldset class="pf-inner" disabled={Boolean(pending)}>
		{#if fromLink}
			{@render linkField()}
			<details bind:this={details} open={Boolean(values.external_url || values.title || preview)}>
				<summary>Writing details</summary>
				{@render writingFields()}
			</details>
		{:else}
			<p class="pf-intro">Please write clearly. A title and type are all the desk requires.</p>
			{@render writingFields()}
		{/if}
	</fieldset>

	<div class="pf-office">
		<span class="k">For office use only</span>
		<span class="k">Stamped on publication</span>
	</div>

	<div class="pf-foot">
		{#if !fromLink}
			<span class="small-print">Your piece appears in the community writing feed right away.</span>
		{/if}
		<div class="submission-actions">
			{#if fromLink}
				<button
					class="btn btn-secondary"
					type="submit"
					name="intent"
					value="preview"
					disabled={Boolean(pending)}
				>
					{pending === 'preview' ? 'Loading…' : 'Preview link'}
				</button>
			{/if}
			<button class="btn btn-primary" type="submit" disabled={Boolean(pending)}>
				{pending === 'submit' ? 'Saving…' : submitLabel}
			</button>
		</div>
	</div>
</form>

<style>
	fieldset {
		border: 0;
		margin: 0;
		min-inline-size: 0;
	}
	summary {
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 700;
	}
	details[open] summary {
		margin-bottom: 0.85rem;
	}
	.submission-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-inline-start: auto;
	}
	.cols2 {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 0 1.2rem;
	}
	@media (max-width: 520px) {
		.cols2 {
			grid-template-columns: 1fr;
		}
	}
	.current-cover {
		display: block;
		width: 100%;
		max-width: 320px;
		aspect-ratio: 1200 / 630;
		object-fit: cover;
		border: 1px solid var(--rule);
		margin-bottom: 0.6rem;
	}
	.file-btn {
		display: block;
		font-weight: 400;
		font-size: 0.88rem;
		text-transform: none;
		letter-spacing: 0;
		border: 1px dashed var(--rule);
		padding: 0.7rem 1rem;
		cursor: pointer;
		color: var(--muted);
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.file-btn b {
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
		font-weight: 700;
	}
	.file-btn input[type='file'] {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		overflow: hidden;
	}
	.hint {
		margin: 0.5rem 0 0;
		font-size: 0.82rem;
		font-style: italic;
		color: var(--muted);
	}
</style>
