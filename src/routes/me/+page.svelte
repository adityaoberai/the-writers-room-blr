<script>
	import Seo from '$lib/components/Seo.svelte';
	import ProfileForm from '$lib/components/ProfileForm.svelte';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import Flash from '$lib/components/Flash.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';
	import { formatDate } from '$lib/format.js';

	let { data, form } = $props();

	const stampClass = {
		approved: 'st-approved',
		featured: 'st-featured',
		rejected: 'st-rejected',
		pending: 'st-pending'
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
				<a class="btn btn-secondary btn-sm" href="/feedback">Share feedback</a>
				<a class="btn btn-primary btn-sm" href="/submit">Submit writing</a>
			</div>
		</header>

		<div class="wordmarks snapshot">
			<div class="wm">
				<b>{data.submissions.length}</b>
				<span>submission{data.submissions.length === 1 ? '' : 's'} on file</span>
			</div>
			<a class="wm wm-link" href="/rewards">
				<b>Seals</b>
				<span>view your seal ledger →</span>
			</a>
		</div>

		{#if !data.complete}
			<Flash type="info">
				Finish your profile so other writers can find you.
				<button type="button" class="linklike" onclick={() => (showChecklist = true)}>
					See what's needed →
				</button>
			</Flash>
		{/if}
		<FormFeedback {form} />

		<div class="layout">
			<div class="edit">
				<div class="paperform">
					<div class="pf-bar">
						<span>Form 2 - Member record</span>
						<button type="button" class="pf-check" onclick={() => (showChecklist = true)}>
							Profile checklist
						</button>
					</div>
					<div class="pf-inner">
						<p class="pf-intro">Please write clearly. Entries go to press immediately.</p>
						<div class="photo-block">
							<PhotoUpload photoUrl={data.profile.photo_url} name={data.profile.display_name} />
						</div>
						<ProfileForm profile={data.profile} action="?/save" submitLabel="Save profile" />
					</div>
				</div>
			</div>

			<aside class="subs">
				<h2 class="deskhead">Your submissions</h2>
				{#if data.submissions.length}
					<ul class="sub-list">
						{#each data.submissions as s (s.id)}
							<li class="sub-row">
								<div class="sub-main">
									<a href={`/writing/${s.id}`}>{s.title}</a>
									<span class="sub-meta">{s.content_type_label} · {formatDate(s.created_at)}</span>
								</div>
								<div class="sub-side">
									<span class="stamp {stampClass[s.status] ?? 'st-pending'}">{s.status}</span>
									<a class="edit-link" href={`/writing/${s.id}/edit`}>Edit</a>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="tolet">
						<div class="tolet-head">Nothing filed yet</div>
						<p><a href="/submit">Share your first piece →</a></p>
					</div>
				{/if}
			</aside>
		</div>
	</div>
</section>

{#if showChecklist}
	<div class="modal-backdrop" role="presentation">
		<div class="modal paperform" role="dialog" aria-modal="true" aria-labelledby="checklist-title">
			<div class="pf-bar">
				<span id="checklist-title">Profile checklist</span>
				<button type="button" class="modal-close" aria-label="Close" onclick={closeChecklist}>
					×
				</button>
			</div>
			<div class="pf-inner">
				<p class="pf-intro">
					A complete profile helps other writers get to know you.
				</p>
				<ul class="checklist">
					{#each criteria as c (c.label)}
						<li class:met={c.met}>
							<span class="mark" aria-hidden="true">{c.met ? '✕' : '☐'}</span>
							<span>{c.label}</span>
						</li>
					{/each}
				</ul>
				{#if data.complete}
					<p class="done">Your profile is complete. 🎉</p>
				{/if}
				<button class="btn btn-secondary btn-sm" type="button" onclick={closeChecklist}
					>Close</button
				>
			</div>
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
		margin-bottom: 1.2rem;
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
		max-width: 34rem;
		margin-bottom: 1.3rem;
	}
	.wm-link {
		text-decoration: none;
		color: inherit;
	}
	.wm-link:hover b {
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 660px) minmax(0, 1fr);
		justify-content: space-between;
		gap: 2rem;
		align-items: start;
		margin-top: 1rem;
	}
	.edit,
	.subs {
		min-width: 0;
	}
	.pf-check {
		background: none;
		border: none;
		color: var(--paper);
		font: inherit;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.photo-block {
		margin-bottom: 1.25rem;
	}
	.deskhead {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin: 0 0 0.4rem;
	}
	.deskhead::after {
		content: '';
		flex: 1;
		border-top: 3px double var(--rule);
	}
	.sub-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.sub-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		padding: 0.65rem 0.1rem;
		border-bottom: 1px dotted var(--hairline);
	}
	.sub-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.sub-main a {
		font-weight: 700;
		color: var(--ink);
		text-decoration: none;
	}
	.sub-main a:hover {
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.sub-meta {
		font-size: 0.8rem;
		font-style: italic;
		color: var(--muted);
	}
	.sub-side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.4rem;
		flex-shrink: 0;
	}
	.sub-side .edit-link {
		font-weight: 700;
		font-size: 0.82rem;
	}
	.sub-side .stamp {
		font-size: 0.56rem;
		padding: 0.16rem 0.45rem;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
	.linklike {
		background: none;
		border: none;
		color: var(--cta);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(27, 24, 18, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 100;
	}
	.modal {
		width: 100%;
		max-width: 420px;
		background: var(--paper);
	}
	.modal-close {
		background: none;
		border: none;
		font-size: 1.3rem;
		line-height: 1;
		color: var(--paper);
		cursor: pointer;
		padding: 0 0.2rem;
	}
	.checklist {
		list-style: none;
		margin: 0 0 1rem;
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
		color: var(--ink);
	}
	.checklist .mark {
		font-weight: 700;
		color: var(--muted-2);
		width: 1.1rem;
		text-align: center;
	}
	.checklist li.met .mark {
		color: var(--ink);
	}
	.done {
		font-weight: 700;
		color: var(--ledger);
		margin: 0 0 1rem;
	}
</style>
