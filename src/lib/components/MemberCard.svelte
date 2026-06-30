<script>
	import Avatar from './Avatar.svelte';
	let { member } = $props();
	const genres = $derived((member.genres ?? []).slice(0, 3));
	const extra = $derived(Math.max(0, (member.genres ?? []).length - genres.length));
</script>

<a class="card card-hover member" href={`/members/${member.profile_id}`}>
	<div class="head">
		<Avatar src={member.photo_url} name={member.display_name} size={56} />
		<div class="meta">
			<h3>{member.display_name}</h3>
			<p class="loc muted">{member.location || 'Bengaluru'}</p>
		</div>
		{#if member.is_featured}
			<span class="pill pill-amber">★ Featured</span>
		{/if}
	</div>
	{#if member.bio}
		<p class="bio">{member.bio}</p>
	{/if}
	{#if genres.length}
		<ul class="tag-list">
			{#each genres as g (g)}
				<li class="chip chip-accent">{g}</li>
			{/each}
			{#if extra}
				<li class="chip">+{extra}</li>
			{/if}
		</ul>
	{/if}
</a>

<style>
	.member {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		text-decoration: none;
		color: inherit;
		height: 100%;
	}
	.member:hover {
		text-decoration: none;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}
	.meta {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.meta h3 {
		margin: 0;
		font-size: 1.15rem;
	}
	.loc {
		margin: 0.1rem 0 0;
		font-size: 0.85rem;
	}
	.bio {
		margin: 0;
		color: var(--muted);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
