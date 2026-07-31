<script>
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';

	let { data, form } = $props();
	const values = $derived(form?.values ?? {});

	let submitting = $state(false);
	let attachmentName = $state('');

	const onSubmit = () => {
		submitting = true;
		return async ({ result, update }) => {
			try {
				await update();
			} finally {
				submitting = false;
				if (result.type === 'success') attachmentName = '';
			}
		};
	};
</script>

<Seo
	title="Share feedback"
	description="Tell The Writers' Room BLR team about a problem, an idea or anything else."
	noindex={true}
/>

<section class="section">
	<div class="container narrow">
		<header class="page-head">
			<p class="eyebrow">Letters to the editor</p>
			<h1>Share feedback</h1>
			<p class="lead">
				Spotted something odd? Have an idea for the room? Tell us in your own words, no technical
				detail needed. A screenshot or short recording helps, but isn't mandatory.
			</p>
		</header>

		<FormFeedback {form} />

		<form method="POST" enctype="multipart/form-data" use:enhance={onSubmit} class="paperform">
			<div class="pf-bar">
				<span>Form 9 - Feedback slip</span><span>The Writers&rsquo; Room BLR</span>
			</div>

			<div class="pf-inner">
				<p class="pf-intro">Every note lands on the editor's desk. We read them all.</p>

				<div class="field">
					<label for="category">What is this about?</label>
					<select id="category" name="category" required>
						{#each data.categories as c (c.key)}
							<option value={c.key} selected={values.category === c.key}>{c.label}</option>
						{/each}
					</select>
				</div>

				<div class="field">
					<label for="message">Tell us what happened, or what you'd like to see</label>
					<textarea
						id="message"
						name="message"
						rows="6"
						maxlength="5000"
						required
						placeholder="Describe it the way you'd tell a friend.">{values.message ?? ''}</textarea
					>
				</div>

				<div class="field">
					<label for="page">Where on the site? <span class="optional">- optional</span></label>
					<input
						id="page"
						name="page"
						type="text"
						maxlength="256"
						placeholder="e.g. My profile page, the writing feed…"
						value={values.page ?? ''}
					/>
				</div>

				<div class="field" style="margin-bottom:0">
					<label for="attachment"
						>Screenshot or recording <span class="optional">- optional</span></label
					>
					<label class="file-btn">
						<input
							id="attachment"
							type="file"
							name="attachment"
							accept="image/png,image/jpeg,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime"
							onchange={(e) => (attachmentName = e.currentTarget.files?.[0]?.name ?? '')}
						/>
						<span>Affix a file here - <b>{attachmentName || 'choose a file'}</b></span>
					</label>
					<p class="hint">
						An image (JPG, PNG, WEBP, AVIF, GIF) or video (MP4, WEBM, MOV) up to 100MB.
					</p>
				</div>
			</div>

			<div class="pf-office">
				<span class="k">For office use only</span>
				<span class="k">Filed on receipt</span>
			</div>

			<div class="pf-foot">
				<span class="small-print">Your name and email travel with the note so we can reply.</span>
				<button class="btn btn-primary" type="submit" disabled={submitting}>
					{submitting ? 'Sending…' : 'Send feedback'}
				</button>
			</div>
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
