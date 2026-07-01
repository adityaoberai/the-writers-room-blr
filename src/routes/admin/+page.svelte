<script>
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';
	import { REWARD_ACTION_LABELS } from '$lib/constants.js';
	import { formatNumber, formatDate } from '$lib/format.js';

	let { data, form } = $props();
	const d = $derived(data.dashboard);

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'members', label: 'Members' },
		{ id: 'submissions', label: 'Submissions' },
		{ id: 'featured', label: 'Featured' },
		{ id: 'rewards', label: 'Rewards' },
		{ id: 'content', label: 'Site content' },
		{ id: 'events', label: 'Events' }
	];
	let tab = $state('overview');

	const statusClass = {
		approved: 'pill-green',
		featured: 'pill-amber',
		rejected: 'pill-red',
		pending: 'pill-gray'
	};
</script>

<Seo
	title="Admin dashboard"
	description="Manage members, submissions, rewards and content."
	noindex={true}
/>

<section class="section">
	<div class="container">
		<header class="page-head">
			<div>
				<p class="eyebrow">Platform</p>
				<h1>Admin dashboard</h1>
			</div>
		</header>

		<FormFeedback {form} />

		<div class="tabs" role="tablist" aria-label="Admin sections">
			{#each tabs as t (t.id)}
				<button
					role="tab"
					aria-selected={tab === t.id}
					class="tab"
					class:active={tab === t.id}
					onclick={() => (tab = t.id)}
				>
					{t.label}
				</button>
			{/each}
		</div>

		<!-- OVERVIEW -->
		{#if tab === 'overview'}
			<div class="metrics">
				<div class="card metric">
					<span class="m-num">{d.memberCounts.total}</span><span class="muted">Members</span>
				</div>
				<div class="card metric">
					<span class="m-num">{d.memberCounts.listed}</span><span class="muted">Listed</span>
				</div>
				<div class="card metric">
					<span class="m-num">{d.memberCounts.featured}</span><span class="muted"
						>Featured members</span
					>
				</div>
				<div class="card metric">
					<span class="m-num">{d.submissionCounts.total}</span><span class="muted">Submissions</span
					>
				</div>
				<div class="card metric">
					<span class="m-num">{d.submissionCounts.rejected}</span><span class="muted"
						>Unlisted writing</span
					>
				</div>
				<div class="card metric">
					<span class="m-num">{d.submissionCounts.featured}</span><span class="muted"
						>Featured writing</span
					>
				</div>
				<div class="card metric">
					<span class="m-num">{formatNumber(d.rewardStats.total_points_awarded)}</span><span
						class="muted">Points awarded</span
					>
				</div>
				<div class="card metric">
					<span class="m-num">{d.rewardStats.badges_awarded}</span><span class="muted"
						>Badges earned</span
					>
				</div>
			</div>
			<div class="grid grid-2" style="margin-top:1.5rem">
				<div class="card">
					<h3>At a glance</h3>
					<ul class="bullets">
						<li><strong>{d.queues.unlisted}</strong> members currently unlisted</li>
						<li><strong>{d.submissionCounts.rejected}</strong> submissions currently unlisted</li>
					</ul>
				</div>
				<div class="card">
					<h3>Quick links</h3>
					<div class="quick">
						<button class="btn btn-secondary btn-sm" onclick={() => (tab = 'submissions')}
							>Moderate submissions</button
						>
						<button class="btn btn-secondary btn-sm" onclick={() => (tab = 'members')}
							>Review members</button
						>
						<button class="btn btn-secondary btn-sm" onclick={() => (tab = 'content')}
							>Edit homepage</button
						>
					</div>
				</div>
			</div>
		{/if}

		<!-- MEMBERS -->
		{#if tab === 'members'}
			<h2>Member moderation</h2>
			<p class="muted">
				Every member is listed in the directory by default. Unlist to hide someone, feature to
				spotlight them, or grant admin access.
			</p>
			<div class="table-wrap">
				<table class="data">
					<thead>
						<tr><th>Member</th><th>Profile</th><th>Listed</th><th>Role</th><th>Actions</th></tr>
					</thead>
					<tbody>
						{#each d.queues.members as m (m.raw_id)}
							<tr>
								<td>
									<a href={`/members/${m.raw_id}`}>{m.profile.display_name}</a>
									<div class="muted small">{m.profile.location}</div>
								</td>
								<td>
									{#if m.complete}<span class="pill pill-green">Complete</span>{:else}<span
											class="pill pill-gray">Incomplete</span
										>{/if}
									{#if !m.profile.is_public}<span class="pill pill-red">Private</span>{/if}
								</td>
								<td>
									{#if m.listed}<span class="pill pill-green">Listed</span>{:else}<span
											class="pill pill-gray">Unlisted</span
										>{/if}{#if m.profile.is_featured}
										★{/if}
								</td>
								<td>
									{#if m.is_admin}<span class="pill pill-amber">Admin</span>{:else}<span
											class="muted">Member</span
										>{/if}
								</td>
								<td class="actions">
									<form method="POST" action="?/setMemberListed" use:enhance>
										<input type="hidden" name="profile_id" value={m.raw_id} />
										<input type="hidden" name="listed" value={m.listed ? 'false' : 'true'} />
										<button class="btn btn-secondary btn-sm" type="submit"
											>{m.listed ? 'Unlist' : 'List'}</button
										>
									</form>
									<form method="POST" action="?/featureMember" use:enhance>
										<input type="hidden" name="profile_id" value={m.raw_id} />
										<input
											type="hidden"
											name="featured"
											value={m.profile.is_featured ? 'false' : 'true'}
										/>
										<button class="btn btn-ghost btn-sm" type="submit"
											>{m.profile.is_featured ? 'Unfeature' : 'Feature'}</button
										>
									</form>
									{#if m.user_id !== data.currentUserId}
										<form method="POST" action="?/setMemberAdmin" use:enhance>
											<input type="hidden" name="user_id" value={m.user_id} />
											<input
												type="hidden"
												name="make_admin"
												value={m.is_admin ? 'false' : 'true'}
											/>
											<button class="btn btn-ghost btn-sm" type="submit"
												>{m.is_admin ? 'Remove admin' : 'Make admin'}</button
											>
										</form>
									{/if}
								</td>
							</tr>
						{/each}
						{#if !d.queues.members.length}
							<tr><td colspan="5" class="muted">No members yet.</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- SUBMISSIONS -->
		{#if tab === 'submissions'}
			<h2>Submissions</h2>
			<p class="muted">
				New writing is listed automatically. Unlist to hide a piece from the public site, or list it
				again.
			</p>
			{#if d.queues.submissions.length}
				<div class="table-wrap">
					<table class="data">
						<thead>
							<tr><th>Title</th><th>Author</th><th>Type</th><th>Status</th><th></th></tr>
						</thead>
						<tbody>
							{#each d.queues.submissions as s (s.id)}
								{@const isPublic = s.status === 'approved' || s.status === 'featured'}
								<tr>
									<td><a href={`/writing/${s.id}`}>{s.title}</a></td>
									<td>{s.author?.display_name ?? 'Unknown'}</td>
									<td>{s.content_type_label}</td>
									<td
										><span class="pill {statusClass[s.status] ?? 'pill-gray'}">{s.status}</span></td
									>
									<td>
										<form method="POST" action="?/moderateSubmission" use:enhance>
											<input type="hidden" name="id" value={s.id} />
											<input
												type="hidden"
												name="status"
												value={isPublic ? 'rejected' : 'approved'}
											/>
											<button class="btn btn-secondary btn-sm" type="submit"
												>{isPublic ? 'Unlist' : 'List'}</button
											>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="card muted">No submissions yet.</div>
			{/if}
		{/if}

		<!-- FEATURED -->
		{#if tab === 'featured'}
			<h2>Featured writing</h2>
			<p class="muted">Spotlight approved pieces on the homepage.</p>
			<div class="table-wrap">
				<table class="data">
					<thead><tr><th>Title</th><th>Author</th><th>Status</th><th></th></tr></thead>
					<tbody>
						{#each data.approvedSubmissions as s (s.id)}
							<tr>
								<td><a href={`/writing/${s.id}`}>{s.title}</a></td>
								<td>{s.author?.display_name ?? '-'}</td>
								<td><span class="pill {statusClass[s.status]}">{s.status}</span></td>
								<td>
									<form method="POST" action="?/featureSubmission" use:enhance>
										<input type="hidden" name="id" value={s.id} />
										<input
											type="hidden"
											name="featured"
											value={s.status === 'featured' ? 'false' : 'true'}
										/>
										<button class="btn btn-secondary btn-sm" type="submit"
											>{s.status === 'featured' ? 'Unfeature' : 'Feature'}</button
										>
									</form>
								</td>
							</tr>
						{/each}
						{#if !data.approvedSubmissions.length}
							<tr><td colspan="4" class="muted">No approved submissions yet.</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
			<p class="muted" style="margin-top:1rem">
				Spotlight members from the <button class="linklike" onclick={() => (tab = 'members')}
					>Members</button
				> tab.
			</p>
		{/if}

		<!-- REWARDS -->
		{#if tab === 'rewards'}
			<h2>Reward rules</h2>
			<p class="muted">Set how many points each action earns. Toggle rules on or off.</p>
			<div class="grid grid-2">
				{#each d.rewardStats.rules as r (r.$id)}
					<form method="POST" action="?/saveRule" use:enhance class="card rule-edit">
						<h3>{REWARD_ACTION_LABELS[r.action_key] ?? r.action_key}</h3>
						<input type="hidden" name="action_key" value={r.action_key} />
						<div class="rule-fields">
							<label>
								Points
								<input type="number" name="points" min="0" value={r.points} />
							</label>
							<label class="inline">
								<input type="checkbox" name="is_active" checked={r.is_active} />
								Active
							</label>
						</div>
						<button class="btn btn-secondary btn-sm" type="submit">Save</button>
					</form>
				{/each}
			</div>
		{/if}

		<!-- CONTENT -->
		{#if tab === 'content'}
			<h2>Site content</h2>
			<p class="muted">Edit the public homepage copy and the Luma calendar embed.</p>
			<div class="stack">
				{#each data.editableSettings as setting (setting.key)}
					<form method="POST" action="?/saveSetting" use:enhance class="card setting">
						<input type="hidden" name="key" value={setting.key} />
						<label for={`s-${setting.key}`}>{setting.label}</label>
						{#if setting.type === 'textarea'}
							<textarea id={`s-${setting.key}`} name="value" rows="3"
								>{data.settings[setting.key] ?? ''}</textarea
							>
						{:else}
							<input
								id={`s-${setting.key}`}
								name="value"
								type="text"
								value={data.settings[setting.key] ?? ''}
							/>
						{/if}
						<button class="btn btn-secondary btn-sm" type="submit">Save</button>
					</form>
				{/each}
			</div>
		{/if}

		<!-- EVENTS -->
		{#if tab === 'events'}
			<h2>Events</h2>
			<div class="grid grid-2">
				<form method="POST" action="?/createEvent" use:enhance class="card stack">
					<h3>Add an event</h3>
					<div class="field">
						<label for="e-title">Title</label><input id="e-title" name="title" required />
					</div>
					<div class="field">
						<label for="e-start">Starts</label><input
							id="e-start"
							name="start_at"
							type="datetime-local"
						/>
					</div>
					<div class="field">
						<label for="e-end">Ends</label><input id="e-end" name="end_at" type="datetime-local" />
					</div>
					<div class="field">
						<label for="e-loc">Location</label><input
							id="e-loc"
							name="location"
							placeholder="Venue or Online"
						/>
					</div>
					<div class="field">
						<label for="e-url">Luma / registration URL</label><input
							id="e-url"
							name="external_url"
							type="url"
							placeholder="https://lu.ma/…"
						/>
					</div>
					<div class="field">
						<label for="e-desc">Description</label><textarea id="e-desc" name="description" rows="2"
						></textarea>
					</div>
					<button class="btn btn-primary btn-sm" type="submit">Add event</button>
				</form>
				<div>
					<h3>Scheduled</h3>
					<ul class="event-list">
						{#each data.events as e (e.id)}
							<li class="card">
								<div>
									<strong>{e.title}</strong>
									<div class="muted small">
										{e.start_at ? formatDate(e.start_at) : 'No date'} · {e.location || '-'}
									</div>
								</div>
								<form method="POST" action="?/deleteEvent" use:enhance>
									<input type="hidden" name="id" value={e.id} />
									<button class="btn btn-danger btn-sm" type="submit">Delete</button>
								</form>
							</li>
						{/each}
						{#if !data.events.length}<li class="muted">No events.</li>{/if}
					</ul>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	.page-head {
		margin-bottom: 1rem;
	}
	.page-head h1 {
		margin: 0;
	}
	.tabs {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1.5rem;
	}
	.tab {
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 0.6rem 0.9rem;
		font: inherit;
		font-weight: 600;
		color: var(--muted);
		cursor: pointer;
	}
	.tab:hover {
		color: var(--navy);
	}
	.tab.active {
		color: var(--accent-strong);
		border-bottom-color: var(--accent);
	}
	.metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}
	.metric {
		text-align: center;
		padding: 1.2rem 0.8rem;
	}
	.m-num {
		display: block;
		font-family: var(--font-sans);
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--navy);
	}
	h2 {
		font-size: 1.4rem;
		margin: 0 0 0.4rem;
	}
	h3 {
		font-size: 1.05rem;
		margin: 0 0 0.6rem;
	}
	.bullets {
		margin: 0;
		padding-left: 1.1rem;
		color: var(--muted);
		line-height: 1.9;
	}
	.quick {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.actions {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.actions form {
		margin: 0;
	}
	.small {
		font-size: 0.82rem;
	}
	.mod-row {
		display: flex;
		gap: 1.25rem;
		justify-content: space-between;
		flex-wrap: wrap;
	}
	.mod-main {
		flex: 1;
		min-width: 0;
	}
	.mod-top {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.mod-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 220px;
	}
	.mod-actions .btns {
		display: flex;
		gap: 0.4rem;
	}
	.rule-edit .rule-fields {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		margin-bottom: 0.8rem;
	}
	.rule-edit label {
		display: block;
	}
	.rule-edit label.inline {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 500;
	}
	.rule-edit input[type='number'] {
		width: 6rem;
	}
	.rule-edit input[type='checkbox'] {
		width: auto;
	}
	.setting label {
		margin-bottom: 0.4rem;
	}
	.setting button {
		margin-top: 0.6rem;
	}
	.event-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}
	.event-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.event-list li.card form {
		margin: 0;
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
</style>
