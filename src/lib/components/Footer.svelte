<script>
	import { SITE } from '$lib/seo.js';
	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="container">
		<div class="footer-grid">
			<div>
				<a class="brand" href="/">
					<img src="/logo-mark.png" alt="" width="30" height="30" style="border-radius: 22%" />
					<span>The Writers' Room <strong>BLR</strong></span>
				</a>
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
			<p>© {year} {SITE.name}. Made in Bengaluru.</p>
			<p class="muted">Sessions are calm, focused and phone-down.</p>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		background: var(--navy);
		color: #cbd5e1;
		margin-top: 4rem;
		padding-block: 3rem 1.5rem;
	}
	.footer-grid {
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr;
		gap: 2rem;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		color: #f8fafc;
		font-family: var(--font-sans);
		font-size: 1.1rem;
		text-decoration: none;
	}
	.brand strong {
		color: var(--accent-2);
	}
	.tag {
		max-width: 30ch;
		margin-top: 0.8rem;
		color: #94a3b8;
	}
	h4 {
		color: #f8fafc;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		text-transform: uppercase;
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
		color: #cbd5e1;
		text-decoration: none;
	}
	a:hover {
		color: #fff;
		text-decoration: underline;
	}
	.footer-bottom {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		margin-top: 2.5rem;
		padding-top: 1.5rem;
		font-size: 0.85rem;
	}
	.footer-bottom p {
		margin: 0;
	}
	.footer-bottom .muted {
		color: #94a3b8;
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
