<script>
	import Seo from '$lib/components/Seo.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import SubmissionCard from '$lib/components/SubmissionCard.svelte';
	import BadgeMedal from '$lib/components/BadgeMedal.svelte';
	import { formatNumber } from '$lib/format.js';

	let { data } = $props();
	const m = $derived(data.member);
	const desc = $derived(
		(m.bio || `${m.display_name} is a member of The Writers' Room BLR.`).slice(0, 160)
	);
</script>

<Seo title={m.display_name} description={desc} type="profile" noindex={!data.listed} />

<section class="section">
	<div class="container">
		<a class="back" href="/directory">← Back to directory</a>

		<div class="card profile-head">
			<Avatar src={m.photo_url} name={m.display_name} size={96} />
			<div class="ph-meta">
				<div class="ph-top">
					<h1>{m.display_name}</h1>
					{#if m.is_featured}<span class="pill pill-amber">★ Featured</span>{/if}
					{#if !data.listed}<span class="pill pill-gray">Not yet listed</span>{/if}
				</div>
				<p class="muted loc">{m.location || 'Bengaluru'}</p>
				{#if m.genres?.length}
					<ul class="tag-list">
						{#each m.genres as g (g)}<li class="chip chip-accent">{g}</li>{/each}
					</ul>
				{/if}
			</div>
			<div class="ph-side">
				<div class="points">
					<span class="pts">{formatNumber(data.points)}</span>
					<span class="muted">points</span>
				</div>
				{#if data.isOwner}
					<a class="btn btn-secondary btn-sm" href="/me">Edit profile</a>
				{/if}
			</div>
		</div>

		<div class="profile-grid">
			<div class="main stack">
				{#if m.bio}
					<section class="card">
						<h2>About</h2>
						<p class="prose">{m.bio}</p>
					</section>
				{/if}

				<section>
					<h2>Writing</h2>
					{#if data.submissions.length}
						<div class="grid grid-2">
							{#each data.submissions as s (s.id)}
								<SubmissionCard submission={s} />
							{/each}
						</div>
					{:else}
						<div class="card muted">No published writing yet.</div>
					{/if}
				</section>
			</div>

			<aside class="side stack">
				{#if m.links?.length}
					<section class="card">
						<h3><Icon name="link" size={18} /> Links</h3>
						<ul class="links">
							{#each m.links as l (l.url)}
								<li>
									<a href={l.url} target="_blank" rel="noopener noreferrer nofollow">{l.label} ↗</a>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				{#if data.badges.length}
					<section class="card">
						<h3><Icon name="trophy" size={18} /> Badges</h3>
						<div class="stack">
							{#each data.badges as b (b.id)}
								<BadgeMedal badge={b} />
							{/each}
						</div>
					</section>
				{/if}
			</aside>
		</div>
	</div>
</section>

<style>
	.back {
		display: inline-block;
		margin-bottom: 1rem;
		font-weight: 600;
		font-size: 0.9rem;
	}
	.profile-head {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.ph-meta {
		flex: 1;
		min-width: 220px;
	}
	.ph-top {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.ph-top h1 {
		margin: 0;
		font-size: 2rem;
	}
	.loc {
		margin: 0.2rem 0 0.6rem;
	}
	.ph-side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.6rem;
	}
	.points {
		text-align: right;
		line-height: 1.1;
	}
	.pts {
		display: block;
		font-family: var(--font-sans);
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent-strong);
	}
	.profile-grid {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 1.5rem;
		margin-top: 1.5rem;
		align-items: start;
	}
	h2 {
		font-size: 1.4rem;
		margin-bottom: 0.8rem;
	}
	h3 {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-sans);
		font-size: 0.95rem;
		text-transform: uppercase;
		color: var(--muted);
		margin: 0 0 0.8rem;
	}
	.links {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	@media (max-width: 860px) {
		.profile-grid {
			grid-template-columns: 1fr;
		}
		.ph-side {
			align-items: flex-start;
		}
	}
</style>
