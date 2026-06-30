<script>
	/**
	 * Rotates through `words`, typing and deleting each with a blinking caret.
	 * The animated text is aria-hidden; a visually-hidden static list carries the
	 * same words for screen readers. Honors prefers-reduced-motion (shows the
	 * first word, no animation).
	 */
	let { words = [], typeMs = 85, deleteMs = 40, holdMs = 1500 } = $props();

	let display = $state(words[0] ?? '');

	$effect(() => {
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (reduce || words.length <= 1) {
			display = words[0] ?? '';
			return;
		}

		let wordIndex = 0;
		let charIndex = words[0].length;
		let deleting = false;
		let timer;

		const tick = () => {
			const word = words[wordIndex];
			if (!deleting) {
				charIndex += 1;
				display = word.slice(0, charIndex);
				if (charIndex >= word.length) {
					deleting = true;
					timer = setTimeout(tick, holdMs);
					return;
				}
				timer = setTimeout(tick, typeMs);
			} else {
				charIndex -= 1;
				display = word.slice(0, Math.max(0, charIndex));
				if (charIndex <= 0) {
					deleting = false;
					wordIndex = (wordIndex + 1) % words.length;
					timer = setTimeout(tick, typeMs * 2);
					return;
				}
				timer = setTimeout(tick, deleteMs);
			}
		};

		timer = setTimeout(tick, holdMs);
		return () => clearTimeout(timer);
	});
</script>

<span class="typewriter" aria-hidden="true">{display}<span class="tw-caret"></span></span>
<span class="visually-hidden">{words.join(', ')}</span>

<style>
	.typewriter {
		color: var(--accent-strong);
		white-space: nowrap;
	}
	.tw-caret {
		display: inline-block;
		width: 0.06em;
		height: 1em;
		margin-left: 0.05em;
		background: var(--highlight);
		vertical-align: -0.12em;
		animation: tw-blink 1.05s steps(1, start) infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		.tw-caret {
			animation: none;
		}
	}
	@keyframes tw-blink {
		50% {
			opacity: 0;
		}
	}
</style>
