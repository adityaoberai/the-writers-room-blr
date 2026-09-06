<script>
	/**
	 * Filter bar for admin data tables: a free-text search plus one <select> per
	 * field. The parent owns the values (bound) and does the filtering, so this
	 * component stays presentational.
	 *
	 * `fields`: [{ key, label, options: [{ value, label }] }]. An empty value
	 * means "all" for that field.
	 */
	let {
		fields = [],
		values = $bindable({}),
		search = $bindable(''),
		searchLabel = 'Search',
		searchPlaceholder = 'Search...',
		shown = 0,
		total = 0,
		noun = 'rows'
	} = $props();

	const active = $derived(search.trim().length > 0 || fields.some((f) => values[f.key]));

	function reset() {
		search = '';
		for (const f of fields) values[f.key] = '';
	}
</script>

<div class="filters" role="search">
	<div class="filter search">
		<label for={`filter-search-${noun}`}>{searchLabel}</label>
		<input
			id={`filter-search-${noun}`}
			type="search"
			placeholder={searchPlaceholder}
			bind:value={search}
			autocomplete="off"
		/>
	</div>
	{#each fields as f (f.key)}
		<div class="filter">
			<label for={`filter-${noun}-${f.key}`}>{f.label}</label>
			<select id={`filter-${noun}-${f.key}`} bind:value={values[f.key]}>
				<option value="">All</option>
				{#each f.options as o (o.value)}
					<option value={o.value}>{o.label}</option>
				{/each}
			</select>
		</div>
	{/each}
	<div class="summary" aria-live="polite">
		<span class="count">
			{#if active}Showing {shown} of {total} {noun}{:else}{total} {noun}{/if}
		</span>
		{#if active}
			<button type="button" class="clear" onclick={reset}>Clear filters</button>
		{/if}
	</div>
</div>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem 1.25rem;
		margin: 1rem 0 0.9rem;
		padding: 0.8rem 1rem;
		border: 1px solid var(--rule);
		background: var(--paper);
	}
	.filter {
		min-width: 150px;
		flex: 0 1 180px;
	}
	.filter.search {
		flex: 1 1 240px;
	}
	.summary {
		display: flex;
		align-items: baseline;
		gap: 0.8rem;
		margin-left: auto;
		padding-bottom: 0.4rem;
		font-size: 0.82rem;
		color: var(--muted);
		white-space: nowrap;
	}
	.clear {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
		cursor: pointer;
	}
	@media (max-width: 640px) {
		.filter,
		.filter.search {
			flex: 1 1 100%;
		}
		.summary {
			margin-left: 0;
		}
	}
</style>
