<script>
	import { enhance } from '$app/forms';
	import { develop } from '$lib/actions/develop.js';

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

<form method="POST" enctype="multipart/form-data" use:enhance={onSubmit} class="paperform">
	<div class="pf-bar">
		<span>Form 7 — Submission slip</span><span>The Writers&rsquo; Room BLR</span>
	</div>

	<div class="pf-inner">
		<p class="pf-intro">Please write clearly. A title and type are all the desk requires.</p>

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

		<div class="cols2">
			<div class="field">
				<label for="content_type">Type</label>
				<select id="content_type" name="content_type" required>
					{#each types as t (t.key)}
						<option value={t.key} selected={values.content_type === t.key}>{t.label}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="external_url">Link <span class="optional">— optional</span></label>
				<input
					id="external_url"
					name="external_url"
					type="url"
					placeholder="https://yourblog.com/post"
					value={values.external_url ?? ''}
				/>
			</div>
		</div>

		<div class="field">
			<label for="summary">Summary <span class="optional">— optional</span></label>
			<textarea
				id="summary"
				name="summary"
				rows="2"
				maxlength="1024"
				placeholder="A one or two line abstract.">{values.summary ?? ''}</textarea
			>
		</div>

		<div class="field" style="margin-bottom:0">
			<label for="image">Cover image <span class="optional">— optional</span></label>
			{#if currentImage}
				<img class="current-cover print-photo" src={currentImage} alt="Current cover" use:develop />
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
					>Affix an image here — <b
						>{imageName || (currentImage ? 'replace the file' : 'choose a file')}</b
					></span
				>
			</label>
			<p class="hint">
				JPG, PNG, WEBP, AVIF or GIF up to 100MB. If you don't upload an image but add an external
				link, we'll automatically use that page's preview (Open Graph) image.
			</p>
		</div>
	</div>

	<div class="pf-office">
		<span class="k">For office use only</span>
		<span class="k">Stamped on publication</span>
	</div>

	<div class="pf-foot">
		<span class="small-print">Your piece appears in the community writing feed right away.</span>
		<button class="btn btn-primary" type="submit" disabled={submitting}>
			{submitting ? 'Saving…' : submitLabel}
		</button>
	</div>
</form>

<style>
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
