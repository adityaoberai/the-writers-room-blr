/**
 * Global toast store (Svelte 5 runes). Import the reactive `toasts` array in the
 * <Toaster /> component and call `toast.success|error|info(message)` from anywhere.
 */
let nextId = 0;

export const toasts = $state([]);

const DEFAULT_DURATION = { success: 4500, info: 4500, error: 7000 };
const MAX_TOASTS = 4;

export function dismissToast(id) {
	const i = toasts.findIndex((t) => t.id === id);
	if (i !== -1) toasts.splice(i, 1);
}

export function pushToast(type, message, { duration } = {}) {
	const text = typeof message === 'string' ? message.trim() : '';
	if (!text) return null;

	// Collapse an identical toast already on screen (e.g. repeated "Invalid code.").
	const dup = toasts.find((t) => t.type === type && t.message === text);
	if (dup) return dup.id;

	// Cap the stack so rapid submits can't grow it unbounded.
	while (toasts.length >= MAX_TOASTS) toasts.shift();

	const id = ++nextId;
	toasts.push({ id, type, message: text });

	const ms = duration ?? DEFAULT_DURATION[type] ?? 4500;
	if (ms > 0 && typeof setTimeout === 'function') {
		setTimeout(() => dismissToast(id), ms);
	}
	return id;
}

export const toast = {
	success: (message, opts) => pushToast('success', message, opts),
	error: (message, opts) => pushToast('error', message, opts),
	info: (message, opts) => pushToast('info', message, opts)
};
