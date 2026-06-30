<script>
	import { applyAction, enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data, form } = $props();

	const step = $derived(form?.step ?? 'email');
	const email = $derived(form?.email ?? '');
	const redirectTo = $derived(form?.redirectTo ?? data.redirectTo ?? '');

	let resendIn = $state(0);
	let requestSubmitting = $state(false);
	let verifySubmitting = $state(false);
	let cooldownTimer;

	// Restart the 30s resend cooldown on each successful code request. Driving
	// this off the request result (not the `step` derived, whose value stays
	// 'verify') ensures it re-arms on every resend.
	function startCooldown() {
		clearInterval(cooldownTimer);
		resendIn = 30;
		cooldownTimer = setInterval(() => {
			resendIn = Math.max(0, resendIn - 1);
			if (resendIn === 0) clearInterval(cooldownTimer);
		}, 1000);
	}

	$effect(() => () => clearInterval(cooldownTimer));

	const enhanceVerify = () => {
		verifySubmitting = true;
		return async ({ result }) => {
			if (result.type === 'redirect') {
				window.location.replace(result.location || '/');
				return;
			}

			await applyAction(result);
			verifySubmitting = false;
		};
	};

	// Request / resend form: track submitting and start the cooldown on success.
	const enhanceRequest = () => {
		requestSubmitting = true;
		return async ({ result, update }) => {
			await update();
			requestSubmitting = false;
			verifySubmitting = false;
			if (result?.type === 'success') startCooldown();
		};
	};
</script>

<Seo
	title="Sign in or join"
	description="Sign in to The Writers' Room BLR with a one-time code sent to your email. No password needed."
	noindex={true}
/>

<section class="section">
	<div class="auth-wrap">
		<div class="card auth-card">
			<FormFeedback {form} />

			{#if step === 'email'}
				<h1>Sign in or join</h1>
				<p class="muted">
					Enter your email and we'll send you a one-time code. New here? This creates your
					membership.
				</p>

				<form method="POST" action="/signin?/request" use:enhance={enhanceRequest} class="stack">
					<div class="field">
						<label for="email">Email address</label>
						<input
							id="email"
							name="email"
							type="email"
							inputmode="email"
							autocomplete="email"
							placeholder="you@example.com"
							value={email}
							required
						/>
					</div>
					<input type="hidden" name="redirect" value={redirectTo} />
					<button class="btn btn-primary btn-block" type="submit" disabled={requestSubmitting}>
						<Icon name="mail" size={18} />
						{requestSubmitting ? 'Sending…' : 'Send my code'}
					</button>
				</form>
			{:else}
				<h1>Check your inbox</h1>
				<p class="muted">
					We sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue.
				</p>

				<form
					method="POST"
					action="/signin?/verify"
					use:enhance={enhanceVerify}
					class="stack"
					aria-busy={verifySubmitting}
				>
					<div class="field">
						<label for="otp">Verification code</label>
						<input
							id="otp"
							name="otp"
							type="text"
							inputmode="numeric"
							autocomplete="one-time-code"
							maxlength="6"
							placeholder="123456"
							readonly={verifySubmitting}
							required
							oninput={(e) =>
								(e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 6))}
						/>
					</div>
					<input type="hidden" name="challenge_id" value={form?.challenge_id ?? ''} />
					<input type="hidden" name="email" value={email} />
					<input type="hidden" name="redirect" value={redirectTo} />
					<button
						class="btn btn-primary btn-block verify-button"
						class:is-loading={verifySubmitting}
						type="submit"
						disabled={verifySubmitting}
						aria-live="polite"
					>
						{#if verifySubmitting}
							<span class="verify-spinner" aria-hidden="true"></span>
							<span>Checking code...</span>
						{:else}
							<Icon name="check" size={18} />
							<span>Verify & continue</span>
						{/if}
					</button>
				</form>

				<div class="resend">
					<form method="POST" action="/signin?/request" use:enhance={enhanceRequest}>
						<input type="hidden" name="email" value={email} />
						<input type="hidden" name="redirect" value={redirectTo} />
						<button
							class="link-btn"
							type="submit"
							disabled={verifySubmitting || requestSubmitting || resendIn > 0}
						>
							{resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
						</button>
					</form>
					<a
						class="link-btn"
						class:is-disabled={verifySubmitting}
						href="/signin"
						aria-disabled={verifySubmitting}
						tabindex={verifySubmitting ? -1 : undefined}
						onclick={(e) => {
							if (verifySubmitting) e.preventDefault();
						}}>Use a different email</a
					>
				</div>
			{/if}
		</div>

		<p class="fine muted">
			By joining you agree to keep the room calm, focused and kind. You control what's public on
			your profile.
		</p>
	</div>
</section>

<style>
	.auth-wrap {
		max-width: 460px;
		margin-inline: auto;
		padding-inline: 1.25rem;
	}
	.auth-card {
		padding: 2rem;
		box-shadow: var(--shadow);
	}
	h1 {
		font-size: 1.9rem;
		margin-bottom: 0.4rem;
	}
	.resend {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1.1rem;
		flex-wrap: wrap;
	}
	.verify-button {
		min-height: 2.75rem;
		gap: 0.5rem;
	}
	.verify-button.is-loading {
		opacity: 1;
		background: #204c7d;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
	}
	.verify-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.45);
		border-top-color: #fff;
		border-radius: 50%;
		animation: verify-spin 0.75s linear infinite;
	}
	.link-btn {
		background: none;
		border: none;
		color: var(--accent-strong);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		text-decoration: none;
	}
	.link-btn:hover {
		text-decoration: underline;
	}
	.link-btn:disabled {
		color: var(--muted-2);
		cursor: not-allowed;
		text-decoration: none;
	}
	.link-btn.is-disabled {
		color: var(--muted-2);
		cursor: not-allowed;
		pointer-events: none;
		text-decoration: none;
	}
	.fine {
		font-size: 0.85rem;
		text-align: center;
		margin-top: 1.25rem;
	}
	@keyframes verify-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
