<script>
	let { member } = $props();
	const genres = $derived((member.genres ?? []).slice(0, 3));
	const extra = $derived(Math.max(0, (member.genres ?? []).length - genres.length));
</script>

<a class="person" href={`/members/${member.profile_id}`}>
	<span class="line1">
		<span class="nm">{member.display_name}</span>
		{#if member.is_featured}<span class="star" title="Featured member">★</span>{/if}
	</span>
	{#if genres.length}
		<span class="line2">{genres.join(' · ')}{extra ? ` · +${extra}` : ''}</span>
	{/if}
	{#if member.seals != null}
		<span class="sealsline">
			{member.seals === 0
				? 'No seals yet'
				: `${member.seals} seal${member.seals === 1 ? '' : 's'} earned`}
		</span>
	{/if}
	{#if member.bio}
		<span class="bio">{member.bio}</span>
	{/if}
</a>

<style>
	/* A fixed slot in the column: every entry prints at the same depth, and a
	   pointer over any part of it tints the whole slot. */
	.person {
		break-inside: avoid;
		display: flex;
		flex-direction: column;
		min-height: 8.4rem;
		color: inherit;
		text-decoration: none;
		border-bottom: 1px dotted var(--hairline);
		padding: 0.6rem 0.35rem 0.65rem;
		transition: background-color 0.18s ease;
	}
	.person:hover {
		color: inherit;
		background: var(--paper-shade);
	}
	.person:hover .nm {
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.line1 {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.nm {
		font-weight: 700;
		font-size: 1.05rem;
		overflow-wrap: anywhere;
	}
	.star {
		font-size: 0.8rem;
	}
	.line2 {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--ink-soft);
	}
	.sealsline {
		display: block;
		margin-top: 0.15rem;
		font-variant: small-caps;
		letter-spacing: 0.06em;
		font-size: 0.85rem;
		color: var(--ledger);
	}
	.bio {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-style: italic;
		color: var(--muted);
		font-size: 0.86rem;
		margin-top: 0.12rem;
	}
</style>
