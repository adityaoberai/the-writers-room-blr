<script>
	import { page } from '$app/stores';
	import { SITE } from '$lib/seo.js';

	let { user = null } = $props();
	let navOpen = $state(false);
	let accountOpen = $state(false);
	let accountEl = $state(null);
	let accountBtn = $state(null);

	const links = [
		{ href: '/', label: 'Front page' },
		{ href: '/directory', label: 'Directory' },
		{ href: '/writing', label: 'Writing' },
		{ href: '/events', label: 'Events' }
	];

	const isActive = (href) =>
		href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href);

	const today = new Intl.DateTimeFormat('en-IN', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'Asia/Kolkata'
	}).format(new Date());

	const firstName = (name) => (name || 'Member').trim().split(/\s+/)[0];

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

<header class="masthead-wrap">
	<div class="dateline">
		<div class="container dateline-inner">
			<span class="dl-vol">Vol. II</span>
			<span>Bengaluru, India</span>
			<span class="dl-date">{today}</span>
			<span class="dl-free">Free for members</span>
		</div>
	</div>

	<div class="masthead container">
		<a class="brand" href="/" aria-label="{SITE.name} front page">The Writers&rsquo; Room BLR</a>
		<p class="tagline">{SITE.tagline}</p>
	</div>

	<div class="navbar">
		<div class="container bar">
			<button
				class="menu-toggle"
				aria-expanded={navOpen}
				aria-controls="primary-nav"
				onclick={() => {
					navOpen = !navOpen;
					accountOpen = false;
				}}
			>
				{navOpen ? 'Close' : 'Pages'}
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
						class="desk-toggle"
						bind:this={accountBtn}
						aria-haspopup="true"
						aria-expanded={accountOpen}
						aria-controls="account-menu"
						onclick={() => {
							accountOpen = !accountOpen;
							navOpen = false;
						}}
					>
						{firstName(user.name)}&rsquo;s desk <span aria-hidden="true">▾</span>
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
				<a class="signin" href="/signin">Sign in</a>
			{/if}
		</div>
	</div>
</header>

<style>
	.masthead-wrap {
		background: var(--paper);
	}
	.dateline {
		border-bottom: 1px solid var(--rule);
	}
	.dateline-inner {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-block: 0.32rem;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
	}
	.masthead {
		text-align: center;
		padding-block: 1.05rem 0.85rem;
	}
	.brand {
		font-weight: 700;
		font-size: clamp(1.9rem, 5vw, 2.9rem);
		line-height: 1;
		letter-spacing: -0.015em;
		color: var(--ink);
		text-decoration: none;
		display: inline-block;
	}
	.brand:hover {
		color: var(--ink);
	}
	.tagline {
		margin: 0.35rem 0 0;
		font-style: italic;
		font-size: 0.88rem;
		color: var(--muted);
	}

	.navbar {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--paper);
		border-top: 3px double var(--rule);
		border-bottom: 1px solid var(--rule);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		min-height: 44px;
		position: relative;
	}
	.nav-links {
		display: flex;
		align-items: stretch;
		gap: 2rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.nav-links a {
		display: flex;
		align-items: center;
		color: var(--ink);
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		text-decoration: none;
		padding: 0.75rem 0;
		border-bottom: 3px solid transparent;
		margin-bottom: -1px;
	}
	.nav-links a:hover {
		border-bottom-color: var(--hairline);
		color: var(--ink);
	}
	.nav-links a[aria-current='page'] {
		border-bottom-color: var(--ink);
	}

	.signin {
		position: absolute;
		right: 1.25rem;
		background: var(--cta);
		color: #fff;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding: 0.5rem 0.95rem;
		text-decoration: none;
	}
	.signin:hover {
		background: var(--cta-deep);
		color: #fff;
	}

	.account {
		position: absolute;
		right: 1.25rem;
	}
	.desk-toggle {
		font: inherit;
		font-variant: small-caps;
		letter-spacing: 0.06em;
		font-size: 0.95rem;
		color: var(--ink);
		background: var(--paper);
		border: 1px solid var(--rule);
		padding: 0.32rem 0.8rem;
		cursor: pointer;
	}
	.desk-toggle:hover {
		background: var(--paper-shade);
	}
	.desk-toggle span {
		color: var(--muted);
	}
	.account-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		min-width: 210px;
		background: var(--paper);
		border: 1px solid var(--rule);
		outline: 1px solid var(--rule);
		outline-offset: 2px;
		padding: 0.3rem 0;
		display: flex;
		flex-direction: column;
		z-index: 200;
	}
	.account-menu a,
	.account-menu .signout {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-bottom: 1px dotted var(--hairline);
		font: inherit;
		font-size: 0.92rem;
		color: var(--ink);
		padding: 0.55rem 0.9rem;
		text-decoration: none;
		cursor: pointer;
	}
	.account-menu a:hover,
	.account-menu .signout:hover {
		background: var(--paper-shade);
		color: var(--ink);
	}
	.account-menu form {
		margin: 0;
	}
	.account-menu .signout {
		color: var(--danger);
		border-bottom: none;
	}

	.menu-toggle {
		display: none;
		background: var(--paper);
		border: 1px solid var(--rule);
		font: inherit;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		padding: 0.45rem 0.8rem;
		color: var(--ink);
		cursor: pointer;
	}

	@media (max-width: 860px) {
		.bar {
			justify-content: flex-start;
		}
		.menu-toggle {
			display: inline-flex;
		}
		.nav {
			position: absolute;
			left: 0;
			right: 0;
			top: 100%;
			background: var(--paper);
			border-bottom: 1px solid var(--rule);
			padding: 0.4rem 1.25rem 0.9rem;
			display: none;
		}
		.nav.open {
			display: block;
		}
		.nav-links {
			flex-direction: column;
			align-items: stretch;
			gap: 0;
		}
		.nav-links a {
			padding: 0.65rem 0;
			border-bottom: 1px dotted var(--hairline);
			margin-bottom: 0;
		}
		.nav-links a[aria-current='page'] {
			border-bottom: 1px dotted var(--hairline);
			color: var(--cta);
		}
	}
	@media (max-width: 700px) {
		.dl-vol,
		.dl-free {
			display: none;
		}
	}
</style>
