<script>
	import { fly } from 'svelte/transition';
	import { toasts, dismissToast } from '$lib/toast.svelte.js';

	const LABEL = { success: 'Set', error: 'Correction', info: 'Notice' };

	// Honour the reduced-motion preference: Svelte JS transitions animate via the
	// Web Animations API, not CSS `transition`, so a CSS media query can't disable
	// them, so gate the duration here instead.
	const reduceMotion =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	const flyParams = reduceMotion ? { y: 0, duration: 0 } : { y: -12, duration: 220 };
</script>

<!-- Not a single live region: each toast carries its own role (alert vs status)
     so error toasts keep assertive priority and aren't demoted by an ancestor. -->
<div class="toaster">
	{#each toasts as t (t.id)}
		<div
			class="toast toast-{t.type}"
			role={t.type === 'error' ? 'alert' : 'status'}
			aria-atomic="true"
			transition:fly={flyParams}
		>
			<span class="t-label">{LABEL[t.type] ?? 'Notice'}</span>
			<p>{t.message}</p>
			<button
				class="t-close"
				type="button"
				aria-label="Dismiss notification"
				onclick={() => dismissToast(t.id)}
			>
				✕
			</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		top: 1rem;
		right: 1rem;
		left: auto;
		z-index: 10500;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: min(380px, calc(100vw - 2rem));
		pointer-events: none;
	}
	/* A compositor's slug: ink on paper, reversed. */
	.toast {
		pointer-events: none;
		display: flex;
		align-items: baseline;
		gap: 0.65rem;
		padding: 0.7rem 0.85rem;
		background: var(--ink);
		color: var(--paper);
		border-left: 4px solid var(--ink);
	}
	.toast p {
		margin: 0;
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.92rem;
		line-height: 1.4;
		color: var(--paper);
	}
	.t-label {
		flex-shrink: 0;
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: var(--hairline);
	}
	.toast-success {
		border-left-color: var(--ledger);
	}
	.toast-error {
		border-left-color: var(--danger);
	}
	.toast-error .t-label {
		color: #e8b0a8;
	}
	.toast-info {
		border-left-color: var(--hairline);
	}
	.t-close {
		pointer-events: auto;
		flex-shrink: 0;
		background: none;
		border: none;
		color: var(--paper);
		font-family: var(--serif);
		font-size: 0.85rem;
		cursor: pointer;
		padding: 2px 4px;
		line-height: 1;
	}
	.t-close:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.15);
	}
	/* While the mobile nav (hamburger) is present, push toasts below the sticky
	   nav bar so they never cover the menu toggle / first nav row. */
	@media (max-width: 860px) {
		.toaster {
			top: calc(48px + 0.6rem);
		}
	}
	@media (max-width: 520px) {
		.toaster {
			right: 0.6rem;
			left: 0.6rem;
			width: auto;
		}
	}
</style>
