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
</script>

<Seo
	title="Your profile"
	description="Manage your Writers' Room BLR profile and submissions."
	noindex={true}
/>

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
			<div class="stat card">
				<span class="num">{data.complete ? 'Complete' : 'Incomplete'}</span>
				<span class="muted">profile</span>
			</div>
			<a class="stat card link" href="/rewards">
				<span class="num">★</span>
				<span class="muted">View rewards →</span>
			</a>
		</div>

		{#if !data.complete}
			<Flash
				type="info"
				message="Add a bio (40+ characters) and at least one genre to complete your profile and join the directory."
			/>
		{/if}
		<FormFeedback {form} />

		<div class="layout">
			<div class="edit">
				<h2>Edit details</h2>
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
								<span class="pill {statusClass[s.status] ?? 'pill-gray'}">{s.status}</span>
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
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
