<script>
	import { page } from '$app/stores';
	import { SITE } from '$lib/seo.js';
	import Avatar from './Avatar.svelte';

	let { user = null } = $props();
	let navOpen = $state(false);
	let accountOpen = $state(false);
	let accountEl = $state(null);
	let accountBtn = $state(null);

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/directory', label: 'Directory' },
		{ href: '/writing', label: 'Writing' },
		{ href: '/events', label: 'Events' }
	];

	const isActive = (href) =>
		href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href);

	// Close both menus whenever the route changes.
	$effect(() => {
		$page.url.pathname;
		navOpen = false;
		accountOpen = false;
	});

	// Dismiss the account dropdown on outside pointer / Escape.
	$effect(() => {
		if (!accountOpen) return;
		const onPointer = (e) => {
			if (accountEl && !accountEl.contains(e.target)) accountOpen = false;
		};
		const onKey = (e) => {
			if (e.key === 'Escape') {
				accountOpen = false;
				accountBtn?.focus();
			}
		};
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

<header class="site-header">
	<div class="container bar">
		<a class="brand" href="/" aria-label="{SITE.name} home">
			<img src="/logo-mark.png" alt="" width="34" height="34" style="border-radius: 22%" />
			<span class="brand-text">The Writers' Room <strong>BLR</strong></span>
		</a>

		<div class="bar-right">
			<button
				class="menu-toggle"
				aria-expanded={navOpen}
				aria-controls="primary-nav"
				aria-label="Menu"
				onclick={() => {
					navOpen = !navOpen;
					accountOpen = false;
				}}
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					{#if navOpen}
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					{:else}
						<path
							d="M4 7h16M4 12h16M4 17h16"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					{/if}
				</svg>
			</button>

			<nav id="primary-nav" class="nav" class:open={navOpen} aria-label="Primary">
				<ul class="nav-links">
					{#each links as link (link.href)}
						<li>
							<a href={link.href} aria-current={isActive(link.href) ? 'page' : undefined}>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			{#if user}
				<div class="account" bind:this={accountEl}>
					<button
						class="account-toggle"
						bind:this={accountBtn}
						aria-haspopup="true"
						aria-expanded={accountOpen}
						aria-controls="account-menu"
						onclick={() => {
							accountOpen = !accountOpen;
							navOpen = false;
						}}
					>
						<Avatar src={user.photo_url} name={user.name} size={34} />
						<span class="account-name">{user.name}</span>
						<svg
							class="chev"
							class:up={accountOpen}
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M6 9l6 6 6-6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					{#if accountOpen}
						<div id="account-menu" class="account-menu">
							<a href="/me">Profile</a>
							<a href="/rewards">Rewards</a>
							<a href="/submit">Submit writing</a>
							{#if user.isAdmin}
								<a href="/admin">Admin</a>
							{/if}
							<form method="POST" action="/api/auth/logout">
								<button class="signout" type="submit">Sign out</button>
							</form>
						</div>
					{/if}
				</div>
			{:else}
				<div class="auth-actions">
					<a class="btn btn-secondary btn-sm" href="/signin">Sign in</a>
					<a class="btn btn-primary btn-sm" href="/signin">Join</a>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: rgba(246, 243, 236, 0.88);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--border);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 68px;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
		color: var(--navy);
		font-family: var(--font-serif);
		font-size: 1.15rem;
		text-decoration: none;
		white-space: nowrap;
	}
	.brand strong {
		color: var(--accent-strong);
	}
	.bar-right {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.nav-links a {
		color: var(--muted);
		font-weight: 500;
		text-decoration: none;
		padding: 0.3rem 0;
		border-bottom: 2px solid transparent;
	}
	.nav-links a:hover {
		color: var(--navy);
	}
	.nav-links a[aria-current='page'] {
		color: var(--navy);
		border-bottom-color: var(--accent);
	}
	.auth-actions {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	/* Account dropdown */
	.account {
		position: relative;
	}
	.account-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 999px;
		padding: 0.25rem 0.55rem 0.25rem 0.3rem;
		cursor: pointer;
		color: var(--navy);
		font: inherit;
		font-weight: 600;
	}
	.account-toggle:hover {
		background: var(--surface-2);
	}
	.account-name {
		max-width: 9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.92rem;
	}
	.chev {
		color: var(--muted-2);
		transition: transform 0.15s ease;
	}
	.chev.up {
		transform: rotate(180deg);
	}
	.account-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		min-width: 210px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
		padding: 0.4rem;
		display: flex;
		flex-direction: column;
		gap: 1px;
		z-index: 200;
	}
	.account-menu a,
	.account-menu .signout {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		font: inherit;
		font-weight: 500;
		color: var(--navy);
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		text-decoration: none;
		cursor: pointer;
	}
	.account-menu a:hover,
	.account-menu .signout:hover {
		background: var(--surface-2);
	}
	.account-menu form {
		margin: 0.2rem 0 0;
		padding-top: 0.2rem;
		border-top: 1px solid var(--border);
	}
	.account-menu .signout {
		color: var(--danger);
	}

	.menu-toggle {
		display: none;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.5rem;
		color: var(--navy);
		cursor: pointer;
	}

	@media (max-width: 860px) {
		.bar-right {
			gap: 0.6rem;
		}
		.menu-toggle {
			display: inline-flex;
			order: 1;
		}
		.account,
		.auth-actions {
			order: 2;
		}
		.nav {
			position: absolute;
			left: 0;
			right: 0;
			top: 100%;
			background: var(--surface);
			border-bottom: 1px solid var(--border);
			box-shadow: var(--shadow);
			padding: 0.6rem 1.25rem 1rem;
			display: none;
		}
		.nav.open {
			display: block;
		}
		.nav-links {
			flex-direction: column;
			align-items: stretch;
			gap: 0.2rem;
		}
		.nav-links a {
			padding: 0.6rem 0;
			border-bottom: 1px solid var(--border);
		}
	}
	@media (max-width: 520px) {
		.brand-text {
			display: none;
		}
		.account-name {
			display: none;
		}
		.auth-actions .btn:first-child {
			display: none;
		}
	}
</style>
