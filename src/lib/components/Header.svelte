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

	const today = new Date().toLocaleDateString('en-IN', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

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
	<!-- Dateline bar -->
	<div class="dateline">
		<div class="container dateline-inner">
			<span>Bengaluru, India</span>
			<span class="edition">Writers' Edition</span>
			<span class="date">{today}</span>
		</div>
	</div>

	<!-- Masthead -->
	<div class="masthead">
		<div class="container">
			<a class="brand" href="/" aria-label="{SITE.name} home">The Writers&rsquo; Room BLR</a>
		</div>
	</div>

	<!-- Section bar -->
	<div class="navbar">
		<div class="container bar">
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
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
						<Avatar src={user.photo_url} name={user.name} size={30} />
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
					<a class="btn btn-primary btn-sm" href="/signin">Sign in</a>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.site-header {
		background: var(--paper);
		border-bottom: 1px solid var(--rule);
	}

	/* Dateline bar */
	.dateline {
		border-bottom: 1px solid var(--rule);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
	}
	.dateline-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-block: 0.35rem;
	}
	.edition {
		color: var(--accent-strong);
		font-weight: 700;
	}

	/* Masthead */
	.masthead {
		text-align: center;
		padding-block: clamp(0.9rem, 2.5vw, 1.4rem);
	}
	.brand {
		font-family: var(--font-masthead);
		font-weight: 400;
		font-size: clamp(1.7rem, 6.5vw, 3.4rem);
		line-height: 1.05;
		color: var(--ink);
		text-decoration: none;
	}
	.brand:hover {
		text-decoration: none;
		color: var(--accent-strong);
	}

	/* Section bar */
	.navbar {
		border-top: 3px double var(--rule);
		position: relative;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 46px;
		position: relative;
	}
	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.8rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.nav-links a {
		display: inline-block;
		color: var(--ink);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		text-decoration: none;
		padding: 0.75rem 0;
		border-bottom: 3px solid transparent;
		margin-bottom: -1px;
	}
	.nav-links a:hover {
		color: var(--accent-strong);
	}
	.nav-links a[aria-current='page'] {
		color: var(--accent-strong);
		border-bottom-color: var(--accent-strong);
	}
	.auth-actions,
	.account {
		position: absolute;
		right: 1.25rem;
		display: flex;
		align-items: center;
	}

	/* Account dropdown */
	.account-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: transparent;
		border: 1px solid transparent;
		padding: 0.2rem 0.4rem 0.2rem 0.25rem;
		cursor: pointer;
		color: var(--ink);
		font: inherit;
		font-weight: 600;
	}
	.account-toggle:hover {
		background: var(--paper-shade);
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
		top: calc(100% + 10px);
		min-width: 210px;
		background: var(--paper-bright);
		border: 1px solid var(--ink);
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
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--ink);
		padding: 0.55rem 0.7rem;
		text-decoration: none;
		cursor: pointer;
	}
	.account-menu a:hover,
	.account-menu .signout:hover {
		background: var(--paper-shade);
	}
	.account-menu form {
		margin: 0.2rem 0 0;
		padding-top: 0.2rem;
		border-top: 1px solid var(--hairline);
	}
	.account-menu .signout {
		color: var(--danger);
	}

	.menu-toggle {
		display: none;
		background: transparent;
		border: 1px solid var(--ink);
		padding: 0.4rem;
		color: var(--ink);
		cursor: pointer;
	}

	@media (max-width: 860px) {
		.bar {
			justify-content: flex-start;
			min-height: 52px;
		}
		.menu-toggle {
			display: inline-flex;
		}
		.nav {
			position: absolute;
			left: 0;
			right: 0;
			top: 100%;
			background: var(--paper-bright);
			border-bottom: 1px solid var(--rule);
			box-shadow: var(--shadow-lg);
			padding: 0.6rem 1.25rem 1rem;
			display: none;
			z-index: 150;
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
			padding: 0.65rem 0;
			border-bottom: 1px solid var(--hairline);
			margin-bottom: 0;
		}
		.nav-links a[aria-current='page'] {
			border-bottom-color: var(--accent-strong);
		}
	}
	@media (max-width: 640px) {
		.dateline .edition {
			display: none;
		}
	}
	@media (max-width: 460px) {
		.dateline .date {
			display: none;
		}
		.dateline-inner {
			justify-content: center;
		}
	}
</style>
