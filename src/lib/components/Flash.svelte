<script>
	let { type = 'info', message = '', children } = $props();
	const role = $derived(type === 'error' ? 'alert' : 'status');
</script>

{#if message || children}
	<div class="alert alert-{type}" {role}>
		{#if message}{message}{:else}{@render children()}{/if}
	</div>
{/if}
