<script>
	import Seo from '$lib/components/Seo.svelte';
	import ProfileForm from '$lib/components/ProfileForm.svelte';
	import PhotoUpload from '$lib/components/PhotoUpload.svelte';
	import FormFeedback from '$lib/components/FormFeedback.svelte';

	let { data, form } = $props();
</script>

<Seo
	title="Set up your profile"
	description="Introduce yourself to The Writers' Room BLR."
	noindex={true}
/>

<section class="section">
	<div class="container narrow">
		<header class="page-head">
			<p class="eyebrow">Welcome</p>
			<h1>Let's set up your profile</h1>
			<p class="lead">
				Tell the community about your writing. A complete profile and your first submission put you
				in the directory.
			</p>
		</header>

		<FormFeedback {form} />

		<div class="block">
			<h2>Profile photo</h2>
			<PhotoUpload photoUrl={data.profile.photo_url} name={data.profile.display_name} />
		</div>

		<div class="block">
			<h2>About you</h2>
			<ProfileForm profile={data.profile} action="?/save" submitLabel="Save & continue" />
		</div>
	</div>
</section>

<style>
	.narrow {
		max-width: 720px;
	}
	.page-head {
		margin-bottom: 1.5rem;
	}
	.page-head h1 {
		margin-bottom: 0.4rem;
	}
	.block {
		margin-bottom: 2rem;
	}
	.block h2 {
		font-size: 1.3rem;
		margin-bottom: 0.8rem;
	}
</style>
