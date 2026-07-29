<script>
	import { SITE } from '$lib/seo.js';

	let { user = null } = $props();
	const year = new Date().getFullYear();
</script>

<footer class="colophon">
	<div class="container">
		<div class="footer-grid">
			<div>
				<a class="brand" href="/">The Writers&rsquo; Room BLR</a>
				<p class="tag">{SITE.tagline}</p>
			</div>
			<nav aria-label="Footer: Explore">
				<h4>Explore</h4>
				<ul>
					<li><a href="/directory">Member directory</a></li>
					<li><a href="/writing">Writings from the community</a></li>
					<li><a href="/events">Upcoming events</a></li>
				</ul>
			</nav>
			<nav aria-label="Footer: Community">
				<h4>Community</h4>
				<ul>
					{#if !user}
						<li><a class="join" href="/signin">Join the room</a></li>
					{/if}
					<li>
						<a href="https://x.com/blrwritersroom" target="_blank" rel="noopener noreferrer">
							Follow on X
						</a>
					</li>
				</ul>
			</nav>
		</div>

		<div class="pressline" aria-hidden="true">
			<span class="presslbl">Press proof</span>
			<span class="dot" style="background:#00aeef"></span>
			<span class="dot" style="background:#ec008c"></span>
			<span class="dot" style="background:#fff200"></span>
			<span class="dot" style="background:#1b1812"></span>
			<span class="reg"></span>
			<span class="presslbl">C&nbsp;·&nbsp;M&nbsp;·&nbsp;Y&nbsp;·&nbsp;K</span>
		</div>

		<div class="footer-bottom">
			<p>© {year} {SITE.name}. Printed nightly in Bengaluru.</p>
			<p class="note">Sessions are calm, focused and phone-down.</p>
		</div>
	</div>
</footer>

<style>
	.colophon {
		margin-top: 3.5rem;
		border-top: 4px solid var(--rule);
		position: relative;
		padding-block: 2.2rem 1.4rem;
		background: var(--paper);
	}
	.colophon::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 6px;
		border-top: 1px solid var(--rule);
	}
	.footer-grid {
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr;
		gap: 2rem;
	}
	.brand {
		font-weight: 700;
		font-size: 1.4rem;
		letter-spacing: -0.01em;
		color: var(--ink);
		text-decoration: none;
	}
	.brand:hover {
		color: var(--ink);
	}
	.tag {
		max-width: 32ch;
		margin: 0.6rem 0 0;
		font-style: italic;
		color: var(--muted);
		font-size: 0.95rem;
	}
	h4 {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: var(--ink);
		border-bottom: 1px solid var(--rule);
		padding-bottom: 0.4rem;
		margin: 0 0 0.8rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.45rem;
		font-size: 0.95rem;
	}
	a {
		color: var(--ink-soft);
		text-decoration: none;
	}
	a:hover {
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	a.join {
		color: var(--cta);
		text-decoration: underline;
		text-underline-offset: 2px;
		font-weight: 700;
	}

	.pressline {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.9rem;
		border-top: 1px solid var(--rule);
		margin-top: 2.1rem;
		padding-top: 1rem;
	}
	.dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 1px solid rgba(27, 24, 18, 0.3);
	}
	.reg {
		width: 18px;
		height: 18px;
		border: 1px solid var(--ink);
		border-radius: 50%;
		position: relative;
		margin-inline: 0.3rem;
	}
	.reg::before,
	.reg::after {
		content: '';
		position: absolute;
		background: var(--ink);
	}
	.reg::before {
		left: 50%;
		top: -3px;
		bottom: -3px;
		width: 1px;
	}
	.reg::after {
		top: 50%;
		left: -3px;
		right: -3px;
		height: 1px;
	}
	.presslbl {
		font-size: 0.66rem;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		color: var(--muted);
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		border-top: 1px solid var(--hairline);
		margin-top: 0.9rem;
		padding-top: 0.8rem;
		font-size: 0.85rem;
	}
	.footer-bottom p {
		margin: 0;
	}
	.footer-bottom .note {
		color: var(--muted);
		font-style: italic;
	}
	@media (max-width: 720px) {
		.footer-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 480px) {
		.footer-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
