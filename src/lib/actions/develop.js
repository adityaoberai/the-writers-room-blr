/**
 * Darkroom action: print photos start grayscale (`.print-photo` / `.avatar`
 * in app.css, gated behind html.js) and develop into color once they come
 * into focus — i.e. enter the viewport. Scrolling away fades them back to
 * gray, and they re-develop on return.
 *
 * The two thresholds form a hysteresis band: develop at `enter` visibility,
 * fade back only below `exit`, and hold the current state in between so the
 * effect never flaps at a boundary. Degrades to "always color" without
 * IntersectionObserver, matching the no-JS behaviour.
 */
export function develop(node, { enter = 0.35, exit = 0.25 } = {}) {
	if (typeof IntersectionObserver === 'undefined') {
		node.classList.add('developed');
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				// Small slack absorbs ratio rounding right at a threshold crossing.
				const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
				if (ratio >= enter - 0.01) {
					node.classList.add('developed');
				} else if (ratio <= exit + 0.01) {
					node.classList.remove('developed');
				}
			}
		},
		{ threshold: [exit, enter] }
	);
	observer.observe(node);

	return { destroy: () => observer.disconnect() };
}
