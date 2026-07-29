<script>
	import { SITE } from '$lib/seo.js';
	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="container">
		<div class="footer-grid">
			<div>
				<a class="brand" href="/">The Writers&rsquo; Room BLR</a>
				<p class="muted tag">{SITE.tagline}</p>
			</div>
			<nav aria-label="Footer: Explore">
				<h4>Explore</h4>
				<ul>
					<li><a href="/directory">Member directory</a></li>
					<li><a href="/writing">Community writing</a></li>
					<li><a href="/events">Upcoming events</a></li>
				</ul>
			</nav>
			<nav aria-label="Footer: Community">
				<h4>Community</h4>
				<ul>
					<li><a href="/signin">Join the room</a></li>
					<li>
						<a href="https://x.com/blrwritersroom" target="_blank" rel="noopener noreferrer">
							Follow on X
						</a>
					</li>
				</ul>
			</nav>
		</div>
		<div class="footer-bottom">
			<p>© {year} {SITE.name}.</p>
			<p class="note">Printed monthky in Bengaluru.</p>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		background: var(--paper);
		color: var(--ink);
		margin-top: 4rem;
		border-top: 6px double var(--rule);
		padding-block: 2.5rem 1.5rem;
	}
	.footer-grid {
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr;
		gap: 2rem;
	}
	.brand {
		display: inline-block;
		font-family: var(--font-masthead);
		font-size: 1.6rem;
		line-height: 1.1;
		color: var(--ink);
		text-decoration: none;
	}
	.brand:hover {
		color: var(--accent-strong);
		text-decoration: none;
	}
	.tag {
		max-width: 30ch;
		margin-top: 0.7rem;
		font-style: italic;
	}
	h4 {
		font-family: var(--font-serif);
		color: var(--ink);
		font-size: 0.76rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		border-bottom: 1px solid var(--rule);
		padding-bottom: 0.4rem;
		margin: 0 0 0.8rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	a {
		color: var(--ink-soft);
		text-decoration: none;
	}
	a:hover {
		color: var(--accent-strong);
		text-decoration: underline;
	}
	.footer-bottom {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		border-top: 1px solid var(--rule);
		margin-top: 2.5rem;
		padding-top: 1rem;
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
