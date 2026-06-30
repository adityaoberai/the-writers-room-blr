<script>
	import { fly } from 'svelte/transition';
	import { toasts, dismissToast } from '$lib/toast.svelte.js';
	import Icon from './Icon.svelte';

	const ICON = { success: 'check', error: 'spark', info: 'mail' };
	const LABEL = { success: 'Success', error: 'Error', info: 'Notice' };

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
			<span class="t-icon" aria-hidden="true"><Icon name={ICON[t.type] ?? 'mail'} size={16} /></span
			>
			<p><span class="visually-hidden">{LABEL[t.type] ?? 'Notice'}: </span>{t.message}</p>
			<button
				class="t-close"
				type="button"
				aria-label="Dismiss notification"
				onclick={() => dismissToast(t.id)}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M6 6l12 12M18 6L6 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
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
		z-index: 300;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: min(380px, calc(100vw - 2rem));
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		padding: 0.8rem 0.9rem;
		border-radius: var(--radius-sm);
		background: var(--surface);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
		border-left-width: 4px;
	}
	.toast p {
		margin: 0;
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 0.92rem;
		line-height: 1.4;
		color: var(--text);
	}
	.t-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 999px;
		flex-shrink: 0;
		margin-top: 1px;
	}
	.toast-success {
		border-left-color: var(--success);
	}
	.toast-success .t-icon {
		background: #dcfce7;
		color: #166534;
	}
	.toast-error {
		border-left-color: var(--danger);
	}
	.toast-error .t-icon {
		background: #fee2e2;
		color: #991b1b;
	}
	.toast-info {
		border-left-color: var(--accent);
	}
	.toast-info .t-icon {
		background: #eaf1f9;
		color: var(--accent-strong);
	}
	.t-close {
		flex-shrink: 0;
		background: none;
		border: none;
		color: var(--muted-2);
		cursor: pointer;
		padding: 2px;
		border-radius: 6px;
		line-height: 0;
	}
	.t-close:hover {
		color: var(--navy);
		background: var(--surface-2);
	}
	/* While the mobile nav (hamburger) is present, push toasts below the 68px
	   sticky header so they never cover the menu toggle / first nav row. */
	@media (max-width: 860px) {
		.toaster {
			top: calc(68px + 0.6rem);
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
