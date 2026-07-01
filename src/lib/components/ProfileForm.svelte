<script>
	import { enhance } from '$app/forms';
	import { GENRE_SUGGESTIONS } from '$lib/constants.js';

	let { profile = {}, action = '?/save', submitLabel = 'Save profile' } = $props();

	let selectedGenres = $state(initialSelectedGenres());
	let draftGenre = $state('');
	const genreValue = $derived(selectedGenres.join(', '));
	const links = $derived(profile.links ?? []);
	let saving = $state(false);
	let fieldsDirty = $state(false);
	let savedGenreValue = $state(genreValue);
	const dirty = $derived(fieldsDirty || genreValue !== savedGenreValue);

	function initialSelectedGenres() {
		return normalizeGenres(profile.genres ?? []);
	}

	function normalizeGenre(value) {
		return String(value ?? '')
			.trim()
			.replace(/\s+/g, ' ');
	}

	function normalizeGenres(values) {
		const items = Array.isArray(values) ? values : String(values ?? '').split(',');
		const seen = [];
		const normalized = [];

		for (const value of items) {
			const genre = normalizeGenre(value);
			const key = genre.toLowerCase();
			if (!genre || seen.includes(key)) continue;
			seen.push(key);
			normalized.push(genre);
		}

		return normalized;
	}

	function addGenre(value) {
		const genre = normalizeGenre(value);
		if (!genre || hasGenre(genre) || selectedGenres.length >= 12) return;
		selectedGenres = [...selectedGenres, genre];
		draftGenre = '';
	}

	function hasGenre(value) {
		const key = normalizeGenre(value).toLowerCase();
		return selectedGenres.some((genre) => genre.toLowerCase() === key);
	}

	function removeGenre(value) {
		const key = value.toLowerCase();
		selectedGenres = selectedGenres.filter((genre) => genre.toLowerCase() !== key);
	}

	function toggleGenre(value) {
		if (hasGenre(value)) {
			removeGenre(value);
		} else {
			addGenre(value);
		}
	}

	function addDraftGenre() {
		const nextGenres = [...selectedGenres];

		for (const genre of normalizeGenres(draftGenre)) {
			const key = genre.toLowerCase();
			const exists = nextGenres.some((selected) => selected.toLowerCase() === key);
			if (exists || nextGenres.length >= 12) continue;
			nextGenres.push(genre);
		}

		selectedGenres = nextGenres;
		draftGenre = '';
	}

	function handleGenreKeydown(event) {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			addDraftGenre();
		}
	}

	const onSubmit = () => {
		saving = true;
		return async ({ update }) => {
			try {
				await update({ reset: false, invalidateAll: false });
				fieldsDirty = false;
				savedGenreValue = genreValue;
			} finally {
				saving = false;
			}
		};
	};

	function markDirty(event) {
		if (event?.target?.id === 'genre-entry') return;
		fieldsDirty = true;
	}
</script>

<form
	method="POST"
	{action}
	use:enhance={onSubmit}
	class="profile-form"
	aria-busy={saving}
	oninput={markDirty}
	onchange={markDirty}
>
	<div class="field">
		<label for="display_name">Display name</label>
		<input
			id="display_name"
			name="display_name"
			type="text"
			maxlength="128"
			required
			value={profile.display_name ?? ''}
		/>
	</div>

	<div class="field">
		<label for="bio">Bio</label>
		<textarea
			id="bio"
			name="bio"
			rows="5"
			maxlength="4000"
			placeholder="Tell the community about your writing: what you work on, what you're looking for."
			>{profile.bio ?? ''}</textarea
		>
		<p class="hint">
			A complete bio (40+ characters) plus a genre unlocks the directory and earns points.
		</p>
	</div>

	<div class="field">
		<label for="genre-entry">Writing interests & genres</label>
		<input name="genres" type="hidden" value={genreValue} />
		<div class="genre-picker">
			{#if selectedGenres.length}
				<ul class="selected-genres" aria-label="Selected writing interests">
					{#each selectedGenres as genre (genre.toLowerCase())}
						<li>
							<button
								type="button"
								class="chip selected-genre"
								aria-label={`Remove ${genre}`}
								onclick={() => removeGenre(genre)}
							>
								<span>{genre}</span>
								<span class="remove-mark" aria-hidden="true">x</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<input
				id="genre-entry"
				type="text"
				bind:value={draftGenre}
				placeholder="Add an interest"
				maxlength="64"
				onkeydown={handleGenreKeydown}
				onblur={addDraftGenre}
			/>
		</div>
		<div class="suggestions">
			{#each GENRE_SUGGESTIONS as g (g)}
				<button
					type="button"
					class="chip genre-suggestion"
					class:is-active={hasGenre(g)}
					aria-pressed={hasGenre(g)}
					onclick={() => toggleGenre(g)}
				>
					{hasGenre(g) ? 'x' : '+'}
					{g}
				</button>
			{/each}
		</div>
	</div>

	<div class="field">
		<label for="location">Location</label>
		<input
			id="location"
			name="location"
			type="text"
			maxlength="128"
			value={profile.location ?? 'Bengaluru'}
		/>
	</div>

	<fieldset class="field links">
		<legend>Links</legend>
		<p class="hint">
			Website, blog, newsletter or social. Shown publicly when your profile is public.
		</p>
		{#each [0, 1, 2, 3] as i (i)}
			<div class="link-row">
				<input
					type="text"
					name="link_label"
					placeholder="Label (e.g. Substack)"
					maxlength="60"
					value={links[i]?.label ?? ''}
				/>
				<input
					type="url"
					name="link_url"
					placeholder="https://..."
					maxlength="2048"
					value={links[i]?.url ?? ''}
				/>
			</div>
		{/each}
	</fieldset>

	<div class="field checkbox">
		<label class="check">
			<input type="checkbox" name="is_public" checked={profile.is_public ?? true} />
			<span>List my profile publicly in the member directory</span>
		</label>
		<p class="hint">You stay in control. Uncheck to keep your profile and links private.</p>
	</div>

	<button class="btn btn-primary" type="submit" disabled={saving || !dirty}>
		{saving ? 'Saving...' : submitLabel}
	</button>
</form>

<style>
	.profile-form {
		max-width: 640px;
	}
	.genre-picker {
		display: grid;
		gap: 0.6rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.7rem;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}
	.genre-picker:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(47, 111, 176, 0.2);
	}
	.selected-genres {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.selected-genre {
		background: var(--accent-strong);
		border-color: var(--accent-strong);
		color: #fff;
	}
	.selected-genre:hover {
		background: #173a63;
	}
	.remove-mark {
		font-weight: 700;
		line-height: 1;
		opacity: 0.8;
	}
	.genre-picker input {
		border: 0;
		border-radius: 0;
		padding: 0.2rem 0;
		box-shadow: none;
		background: transparent;
	}
	.genre-picker input:focus {
		box-shadow: none;
	}
	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}
	.genre-suggestion.is-active {
		background: #eaf1f9;
		color: var(--accent-strong);
		border-color: var(--accent-2);
	}
	.links {
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 1rem;
	}
	.links legend {
		font-weight: 600;
		color: var(--navy);
		padding: 0 0.4rem;
	}
	.link-row {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.check {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		font-weight: 500;
		cursor: pointer;
	}
	.check input {
		width: auto;
		margin-top: 0.2rem;
	}
	@media (max-width: 520px) {
		.link-row {
			grid-template-columns: 1fr;
		}
	}
</style>
