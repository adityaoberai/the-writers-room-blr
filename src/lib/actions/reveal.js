/**
 * Scroll-reveal action: fades/slides an element in when it enters the viewport.
 * Respects prefers-reduced-motion and degrades to "always visible" without
 * IntersectionObserver, so content is never hidden when JS/animation is off.
 */
export function reveal(node, { threshold = 0.12 } = {}) {
	const reduce =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	if (reduce || typeof IntersectionObserver === 'undefined') return;

	// Don't hide content that's already on screen at mount (avoids a flash for
	// above-the-fold sections); only animate what the user scrolls down to.
	if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;

	node.classList.add('reveal-hidden');
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('reveal-shown');
					observer.disconnect();
				}
			}
		},
		{ threshold, rootMargin: '0px 0px -8% 0px' }
	);
	observer.observe(node);

	return { destroy: () => observer.disconnect() };
}
