<script>
	let { type = 'info', message = '' } = $props();
	const role = $derived(type === 'error' ? 'alert' : 'status');
</script>

{#if message}
	<div class="alert alert-{type}" {role}>{message}</div>
{/if}
