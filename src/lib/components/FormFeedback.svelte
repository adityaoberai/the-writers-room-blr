<script>
	/**
	 * Bridges a SvelteKit action result (`form`) to a toast on the client, with a
	 * server-rendered inline fallback for when JavaScript is unavailable (the
	 * fallback is hidden by CSS once `html.js` is set). Render once per page that
	 * has form actions.
	 */
	import { toast } from '$lib/toast.svelte.js';

	let { form } = $props();

	// Toast on each *new* action result (object identity changes per submission).
	// `seen` is a plain, non-reactive guard on purpose: if it were `$state`, the
	// assignment below would wrap the result in a state proxy, so the next run's
	// `f === seen` (raw object vs. proxy) would never match — the effect would
	// re-toast and re-trigger itself until `effect_update_depth_exceeded`.
	let seen = null;
	$effect(() => {
		const f = form;
		if (!f || f === seen) return;
		seen = f;
		if (f.error) toast.error(f.error);
		else if (f.success)
			toast.success(f.success, { duration: f.success === 'Profile saved.' ? 3000 : undefined });
	});
</script>

{#if form?.error}
	<div class="alert alert-error nojs-flash" role="alert">{form.error}</div>
{:else if form?.success}
	<div class="alert alert-success nojs-flash" role="status">{form.success}</div>
{/if}
