<script>
	import Seo from '$lib/components/Seo.svelte';

	const sections = [
		{
			title: 'Respect and Inclusivity',
			points: [
				'Be respectful to all attendees, regardless of their background, experience level, or writing style.',
				'Harassment, discrimination, or offensive language in any form will not be tolerated.',
				'Create a welcoming atmosphere where everyone feels comfortable sharing and participating.'
			]
		},
		{
			title: 'Quiet Working Time',
			points: [
				'During the writing or reading session, maintain a quiet and focused space. If you need to talk, please step outside.',
				'Phones should be on silent to avoid distractions.'
			]
		},
		{
			title: 'Constructive Discussions',
			points: [
				'When engaging in discussions, give and receive feedback with kindness and encouragement.',
				'Avoid unsolicited criticism—ask before offering feedback on someone’s work.'
			]
		},
		{
			title: 'Community Lunch Etiquette',
			points: [
				'Respect different dietary preferences and choices.',
				'If sharing a meal together, be mindful of hygiene and shared spaces.',
				'Conversations should remain inclusive—avoid controversial or divisive topics that might make others uncomfortable.'
			]
		},
		{
			title: 'No Self-Promotion or Spam',
			points: [
				'This is a space for writing and collaboration, not for aggressive self-promotion.',
				'While sharing of work is appreciated, do so in a thoughtful and non-intrusive manner.',
				'No unsolicited brand promotions are allowed without the event organizer’s consent.'
			]
		},
		{
			title: 'Zero Tolerance for Harassment',
			points: [
				'Any form of harassment, bullying, or intimidation will result in immediate removal from the event.'
			],
			report: true
		},
		{
			title: 'Be a Good Community Member',
			points: [
				'Support and encourage fellow writers.',
				'Keep the space clean and respect the venue.',
				'Follow any additional guidelines set by the event organizer.'
			]
		}
	];
</script>

<Seo
	title="Code of Conduct"
	description="The guidelines every participant at The Writers' Room BLR agrees to, for a safe, respectful and productive space to write."
/>

<section class="section">
	<div class="container narrow">
		<header class="page-head">
			<h1>Code of Conduct</h1>
			<p class="lead">
				<strong>Welcome to The Writers&rsquo; Room!</strong> This is a space for writers of all kinds
				to focus on their craft and build a supportive community. To ensure a safe, respectful, and productive
				environment, we ask all participants to adhere to the following guidelines.
			</p>
		</header>

		<ol class="rules">
			{#each sections as s, i (s.title)}
				<li>
					<h2><span class="num">{i + 1}.</span> {s.title}</h2>
					<ul>
						{#each s.points as p (p)}
							<li>{p}</li>
						{/each}
						{#if s.report}
							<li>
								If you experience or witness inappropriate behavior, please report it to the event
								organizer,
								<a href="https://x.com/adityaoberai" target="_blank" rel="noopener noreferrer"
									><strong>Aditya Oberai</strong></a
								>, immediately.
							</li>
						{/if}
					</ul>
				</li>
			{/each}
		</ol>

		<p class="closing">
			By attending <strong>The Writers&rsquo; Room</strong>, you agree to abide by this Code of
			Conduct. Let&rsquo;s make this a positive and inspiring space for all writers!
		</p>
	</div>
</section>

<style>
	.narrow {
		max-width: 720px;
	}
	.page-head {
		margin-bottom: 2rem;
	}
	.page-head h1 {
		margin-bottom: 0.4rem;
	}
	.lead strong {
		color: var(--ink);
	}
	.rules {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.6rem;
	}
	.rules > li {
		border-top: 1px solid var(--rule);
		padding-top: 1rem;
	}
	h2 {
		font-size: 1.25rem;
		margin: 0 0 0.6rem;
	}
	.num {
		color: var(--muted);
	}
	ul {
		margin: 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.4rem;
		line-height: 1.6;
	}
	.closing {
		border-top: 4px double var(--rule);
		margin-top: 2rem;
		padding-top: 1rem;
		font-style: italic;
	}
</style>
