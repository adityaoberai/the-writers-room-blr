<script>
	import { enhance } from '$app/forms';
	import Avatar from './Avatar.svelte';

	let { photoUrl = '', name = '', action = '?/photo' } = $props();
	let uploading = $state(false);
	let fileName = $state('');

	const onSubmit = () => {
		uploading = true;
		return async ({ result, update }) => {
			try {
				await update({ reset: result.type === 'success' });
				if (result.type === 'success') fileName = '';
			} finally {
				uploading = false;
			}
		};
	};
</script>

<div class="photo card">
	<Avatar src={photoUrl} {name} size={84} />
	<form
		method="POST"
		{action}
		enctype="multipart/form-data"
		use:enhance={onSubmit}
		class="photo-form"
		aria-busy={uploading}
	>
		<label class="file-btn">
			<input
				type="file"
				name="photo"
				accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
				onchange={(e) => (fileName = e.currentTarget.files?.[0]?.name ?? '')}
				required
			/>
			<span>{fileName || 'Choose a photo'}</span>
		</label>
		<button class="btn btn-secondary btn-sm" type="submit" disabled={uploading || !fileName}>
			{uploading ? 'Uploading…' : 'Upload'}
		</button>
	</form>
</div>

<style>
	.photo {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.photo-form {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.file-btn {
		display: inline-flex;
		align-items: center;
		font-weight: 500;
		font-size: 0.9rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.8rem;
		cursor: pointer;
		color: var(--muted);
		background: var(--surface-2);
		max-width: 16rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.file-btn input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		overflow: hidden;
	}
</style>
