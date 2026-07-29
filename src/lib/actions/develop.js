/**
 * Darkroom action: print photos start grayscale (`.print-photo` / `.avatar`
 * in app.css, gated behind html.js) and develop into color once they come
 * into focus — i.e. enter the viewport. Scrolling away fades them back to
 * gray, and they re-develop on return.
 *
 * `enter`/`exit` set where that happens: equal values give a single flip
 * point; `enter` above `exit` gives a hysteresis band that holds the current
 * state in between, so the effect can't flap at a boundary. Degrades to
 * "always color" without IntersectionObserver, matching the no-JS behaviour.
 */
export function develop(node, { enter = 0.5, exit = 0.5 } = {}) {
	if (typeof IntersectionObserver === 'undefined') {
		node.classList.add('developed');
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				// Delivered ratios overshoot in the direction of travel, so strict
				// comparisons stay correct even when enter === exit.
				const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
				if (ratio >= enter) {
					node.classList.add('developed');
				} else if (ratio <= exit) {
					node.classList.remove('developed');
				}
			}
		},
		{ threshold: [...new Set([exit, enter])] }
	);
	observer.observe(node);

	return { destroy: () => observer.disconnect() };
}
