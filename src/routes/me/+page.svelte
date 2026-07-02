<script>
	import Seo from '$lib/components/Seo.svelte';
	import ProfileForm from '$lib/components/ProfileForm.svelte';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import Flash from '$lib/components/Flash.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';
	import { formatNumber, formatDate } from '$lib/format.js';

	let { data, form } = $props();

	const statusClass = {
		approved: 'pill-green',
		featured: 'pill-amber',
		rejected: 'pill-red',
		pending: 'pill-gray'
	};

	let showChecklist = $state(false);

	// What makes a profile "complete". Derived from the saved profile so the
	// checklist reflects the last save.
	const criteria = $derived([
		{ label: 'Add a display name', met: !!(data.profile.display_name ?? '').trim() },
		{ label: 'Write a bio', met: (data.profile.bio ?? '').trim().length > 0 },
		{ label: 'Add at least one writing genre', met: (data.profile.genres?.length ?? 0) >= 1 }
	]);

	function closeChecklist() {
		showChecklist = false;
	}

	function onKeydown(event) {
		if (event.key === 'Escape') closeChecklist();
	}
</script>

<Seo
	title="Your profile"
	description="Manage your Writers' Room BLR profile and submissions."
	noindex={true}
/>

<svelte:window onkeydown={onKeydown} />

<section class="section">
	<div class="container">
		<header class="page-head">
			<div>
				<p class="eyebrow">Your account</p>
				<h1>Your profile</h1>
			</div>
			<div class="head-actions">
				<a class="btn btn-secondary btn-sm" href={`/members/${data.profile.id}`}
					>View public profile</a
				>
				<a class="btn btn-primary btn-sm" href="/submit">Submit writing</a>
			</div>
		</header>

		<div class="snapshot">
			<div class="stat card">
				<span class="num">{formatNumber(data.points)}</span>
				<span class="muted">points</span>
			</div>
			<div class="stat card">
				<span class="num">{data.submissions.length}</span>
				<span class="muted">submissions</span>
			</div>
			<a class="stat card link" href="/rewards">
				<span class="num">★</span>
				<span class="muted">View rewards →</span>
			</a>
		</div>

		{#if !data.complete}
			<Flash type="info">
				Finish your profile to earn points.
				<button type="button" class="linklike" onclick={() => (showChecklist = true)}>
					See what's needed →
				</button>
			</Flash>
		{/if}
		<FormFeedback {form} />

		<div class="layout">
			<div class="edit">
				<div class="edit-head">
					<h2>Edit details</h2>
					<button type="button" class="linklike" onclick={() => (showChecklist = true)}>
						Profile checklist
					</button>
				</div>
				<div class="photo-block">
					<PhotoUpload photoUrl={data.profile.photo_url} name={data.profile.display_name} />
				</div>
				<ProfileForm profile={data.profile} action="?/save" submitLabel="Save profile" />
			</div>

			<aside class="subs">
				<h2>Your submissions</h2>
				{#if data.submissions.length}
					<ul class="sub-list">
						{#each data.submissions as s (s.id)}
							<li class="card">
								<div class="sub-main">
									<a href={`/writing/${s.id}`}>{s.title}</a>
									<span class="muted">{s.content_type_label} · {formatDate(s.created_at)}</span>
								</div>
								<div class="sub-side">
									<span class="pill {statusClass[s.status] ?? 'pill-gray'}">{s.status}</span>
									<a class="edit-link" href={`/writing/${s.id}/edit`}>Edit</a>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="card muted">
						No submissions yet. <a href="/submit">Share your first piece →</a>
					</div>
				{/if}
			</aside>
		</div>
	</div>
</section>

{#if showChecklist}
	<div class="modal-backdrop" role="presentation">
		<div class="modal card" role="dialog" aria-modal="true" aria-labelledby="checklist-title">
			<div class="modal-head">
				<h3 id="checklist-title">Profile checklist</h3>
				<button type="button" class="modal-close" aria-label="Close" onclick={closeChecklist}>
					×
				</button>
			</div>
			<p class="muted">
				A complete profile helps other writers get to know you and earns you points.
			</p>
			<ul class="checklist">
				{#each criteria as c (c.label)}
					<li class:met={c.met}>
						<span class="mark" aria-hidden="true">{c.met ? '✓' : '○'}</span>
						<span>{c.label}</span>
					</li>
				{/each}
			</ul>
			{#if data.complete}
				<p class="done">Your profile is complete. 🎉</p>
			{/if}
			<button class="btn btn-secondary btn-sm" type="button" onclick={closeChecklist}>Close</button>
		</div>
	</div>
{/if}

<style>
	.page-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}
	.page-head h1 {
		margin: 0;
	}
	.head-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.snapshot {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.stat {
		text-align: center;
		padding: 1.2rem 1rem;
	}
	.stat .num {
		display: block;
		font-family: var(--font-sans);
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--accent-strong);
	}
	.stat.link {
		text-decoration: none;
		color: inherit;
	}
	.stat.link:hover {
		border-color: var(--accent-2);
	}
	.layout {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 2rem;
		align-items: start;
		margin-top: 1rem;
	}
	h2 {
		font-size: 1.3rem;
		margin-bottom: 1rem;
	}
	.photo-block {
		margin-bottom: 1.25rem;
	}
	.sub-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.sub-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		padding: 0.8rem 1rem;
	}
	.sub-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.sub-main a {
		font-weight: 600;
	}
	.sub-main span {
		font-size: 0.82rem;
	}
	.sub-side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.35rem;
		flex-shrink: 0;
	}
	.sub-side .edit-link {
		font-weight: 600;
		font-size: 0.82rem;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
	.edit-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	.linklike {
		background: none;
		border: none;
		color: var(--accent-strong);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 30, 50, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 100;
	}
	.modal {
		width: 100%;
		max-width: 420px;
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.modal-head h3 {
		margin: 0;
		font-size: 1.2rem;
	}
	.modal-close {
		background: none;
		border: none;
		font-size: 1.6rem;
		line-height: 1;
		color: var(--muted);
		cursor: pointer;
		padding: 0 0.2rem;
	}
	.modal-close:hover {
		color: var(--navy);
	}
	.checklist {
		list-style: none;
		margin: 1rem 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.checklist li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--muted);
	}
	.checklist li.met {
		color: var(--navy);
	}
	.checklist .mark {
		font-weight: 700;
		color: var(--border);
	}
	.checklist li.met .mark {
		color: var(--accent-strong);
	}
	.done {
		font-weight: 600;
		color: var(--accent-strong);
		margin: 0 0 1rem;
	}
</style>
