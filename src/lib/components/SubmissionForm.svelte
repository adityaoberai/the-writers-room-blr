<script>
	import { enhance } from '$app/forms';

	let { types = [], values = {}, currentImage = '', submitLabel = 'Publish' } = $props();

	let submitting = $state(false);
	let imageName = $state('');

	const onSubmit = () => {
		submitting = true;
		return async ({ update }) => {
			try {
				await update();
			} finally {
				submitting = false;
			}
		};
	};
</script>

<form method="POST" enctype="multipart/form-data" use:enhance={onSubmit} class="card form">
	<div class="field">
		<label for="title">Title</label>
		<input
			id="title"
			name="title"
			type="text"
			maxlength="256"
			required
			value={values.title ?? ''}
		/>
	</div>

	<div class="field">
		<label for="content_type">Type</label>
		<select id="content_type" name="content_type" required>
			{#each types as t (t.key)}
				<option value={t.key} selected={values.content_type === t.key}>{t.label}</option>
			{/each}
		</select>
	</div>

	<div class="field">
		<label for="summary">Summary <span class="optional">optional</span></label>
		<textarea
			id="summary"
			name="summary"
			rows="2"
			maxlength="1024"
			placeholder="A one or two line abstract.">{values.summary ?? ''}</textarea
		>
	</div>

	<div class="field">
		<label for="external_url">Link <span class="optional">optional</span></label>
		<input
			id="external_url"
			name="external_url"
			type="url"
			placeholder="https://yourblog.com/post"
			value={values.external_url ?? ''}
		/>
	</div>

	<div class="field">
		<label for="image">Cover image <span class="optional">optional</span></label>
		{#if currentImage}
			<img class="current-cover" src={currentImage} alt="Current cover" />
		{/if}
		<label class="file-btn">
			<input
				id="image"
				type="file"
				name="image"
				accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
				onchange={(e) => (imageName = e.currentTarget.files?.[0]?.name ?? '')}
			/>
			<span>{imageName || (currentImage ? 'Replace image' : 'Choose an image')}</span>
		</label>
		<p class="hint">
			JPG, PNG, WEBP, AVIF or GIF up to 100MB. If you don't upload an image but add an external
			link, we'll automatically use that page's preview (Open Graph) image.
		</p>
	</div>

	<button class="btn btn-primary" type="submit" disabled={submitting}>
		{submitting ? 'Saving…' : submitLabel}
	</button>
</form>

<style>
	.form {
		padding: 1.6rem;
	}
	.optional {
		color: var(--muted-2);
		font-weight: 500;
	}
	.current-cover {
		display: block;
		width: 100%;
		max-width: 320px;
		aspect-ratio: 1200 / 630;
		object-fit: cover;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		margin-bottom: 0.6rem;
	}
	.file-btn {
		display: inline-flex;
		align-items: center;
		font-weight: 500;
		font-size: 0.9rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		padding: 0.6rem 0.9rem;
		cursor: pointer;
		color: var(--muted);
		background: var(--surface-2);
		max-width: 100%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
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
		font-size: 0.85rem;
		color: var(--muted);
	}
</style>
