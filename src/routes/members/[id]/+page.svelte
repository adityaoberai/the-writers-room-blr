<script>
	import Seo from '$lib/components/Seo.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import BadgeMedal from '$lib/components/BadgeMedal.svelte';
	import { formatDate } from '$lib/format.js';

	let { data } = $props();
	const m = $derived(data.member);
	const desc = $derived(
		(m.bio || `${m.display_name} is a member of The Writers' Room BLR.`).slice(0, 160)
	);
</script>

<Seo title={m.display_name} description={desc} type="profile" noindex={!data.listed} />

<section class="section">
	<div class="container narrow">
		<a class="back" href="/directory">← Back to the directory</a>

		<div class="paperform record">
			<div class="pf-bar">
				<span>Directory record</span><span>The Writers&rsquo; Room BLR</span>
			</div>

			<div class="head">
				<figure class="portrait">
					<Avatar src={m.photo_url} name={m.display_name} size={110} />
				</figure>
				<div class="who">
					<h1>{m.display_name}</h1>
					{#if m.genres?.length}
						<ul class="tag-list">
							{#each m.genres as g (g)}<li class="chip">{g}</li>{/each}
						</ul>
					{/if}
				</div>
				<div class="side">
					<span class="role">{m.role ?? 'Member'}</span>
					{#if m.is_featured}<span class="stamp st-featured">★ Featured</span>{/if}
					{#if !data.listed}<span class="stamp st-pending">Not yet listed</span>{/if}
					{#if data.isOwner}
						<a class="btn btn-secondary btn-sm" href="/me">Edit profile</a>
					{/if}
				</div>
			</div>

			<div class="body">
				<div class="about">
					<p class="k">About</p>
					{#if m.bio}
						<p class="prose bio">{m.bio}</p>
					{:else}
						<p class="none">No bio on file yet.</p>
					{/if}
				</div>
				<div class="aside">
					<div>
						<p class="k">On file</p>
						{#if m.links?.length}
							{#each m.links as l (l.url)}
								<div class="row">
									<span>{l.label}</span>
									<span class="leader"></span>
									<a href={l.url} target="_blank" rel="noopener noreferrer nofollow">visit ↗</a>
								</div>
							{/each}
						{:else}
							<p class="none">Nothing filed yet.</p>
						{/if}
					</div>
				</div>
			</div>

			<div class="writing">
				<p class="k">Writing file</p>
				{#if data.submissions.length}
					{#each data.submissions as s (s.id)}
						<a class="piece" href={`/writing/${s.id}`}>
							<b>{s.title}</b>
							<span class="pmeta">
								<span class="ty">{s.content_type_label ?? s.content_type}</span>
								<span class="leader"></span>
								<span class="dt">{formatDate(s.created_at)}</span>
							</span>
						</a>
					{/each}
				{:else}
					<p class="none">No published writing yet - the presses await.</p>
				{/if}
			</div>

			{#if data.badges.length}
				<div class="sealsec">
					<p class="k">Seals earned</p>
					<div class="seals">
						{#each data.badges as b (b.id)}
							<BadgeMedal badge={b} plain />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.narrow {
		max-width: 900px;
	}
	.back {
		display: inline-block;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
	.record {
		margin-top: 0;
	}
	.head {
		display: grid;
		grid-template-columns: 110px 1fr auto;
		gap: 1.2rem;
		padding: 1.2rem 1.3rem;
		border-bottom: 1px solid var(--rule);
		align-items: start;
	}
	.portrait {
		margin: 0;
	}
	.who h1 {
		margin: 0 0 0.15rem;
		font-size: 2rem;
	}
	.side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.7rem;
	}
	.role {
		font-variant: small-caps;
		letter-spacing: 0.14em;
		font-weight: 700;
		font-size: 0.95rem;
	}
	.k {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		border-bottom: 1px solid var(--rule);
		padding-bottom: 0.3rem;
		margin: 0 0 0.6rem;
	}
	.body {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		align-items: stretch;
	}
	.about {
		padding: 1rem 1.3rem;
		border-right: 1px solid var(--hairline);
	}
	.bio {
		margin: 0;
		font-size: 0.95rem;
	}
	.none {
		margin: 0;
		font-style: italic;
		color: var(--muted);
		font-size: 0.9rem;
	}
	.aside {
		padding: 1rem 1.3rem;
		display: grid;
		gap: 1.1rem;
		align-content: start;
	}
	.row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.92rem;
		padding: 0.2rem 0;
	}
	/* Seals run horizontally, pressed along the sheet like the writing file. */
	.sealsec {
		border-top: 1px solid var(--rule);
		padding: 1rem 1.3rem 1.1rem;
	}
	.seals {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.9rem 1.8rem;
	}
	/* Pressed a size up on the record so the lettering reads. */
	.seals :global(.sealsvg) {
		width: 104px;
		height: 104px;
	}
	.writing {
		border-top: 1px solid var(--rule);
		padding: 1rem 1.3rem 1.2rem;
	}
	.piece {
		display: block;
		padding: 0.5rem 0 0.55rem;
		border-bottom: 1px dotted var(--hairline);
		font-size: 0.95rem;
		color: inherit;
		text-decoration: none;
	}
	/* Titles run at most two lines before the ellipsis steps in. */
	.piece b {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}
	.pmeta {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-top: 0.2rem;
	}
	.piece:hover b {
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.piece .ty {
		font-size: 0.64rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--muted);
		white-space: nowrap;
	}
	.piece .dt {
		color: var(--muted);
		font-size: 0.85rem;
		white-space: nowrap;
	}
	@media (max-width: 760px) {
		.head {
			/* Match the portrait's fixed 110px render size so it can't
			   overhang the column. */
			grid-template-columns: 110px 1fr;
		}
		.side {
			grid-column: 1 / -1;
			flex-direction: row;
			align-items: center;
		}
		.body {
			grid-template-columns: 1fr;
		}
		.about {
			border-right: none;
			border-bottom: 1px solid var(--hairline);
		}
	}
</style>
