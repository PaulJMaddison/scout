// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'KynticAI Scout',
			description:
				'Documentation for KynticAI Scout — open-source context infrastructure for AI-enabled products.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/PaulJMaddison/scout',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/PaulJMaddison/scout/edit/main/docs-site/',
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'What is KynticAI Scout?', slug: 'getting-started/what-is-scout' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quickstart', slug: 'getting-started/quickstart' },
					],
				},
				{
					label: 'APIs & SDKs',
					items: [
						{ label: 'API Overview', slug: 'apis/overview' },
						{ label: 'TypeScript SDK', slug: 'apis/typescript-sdk' },
						{ label: '.NET SDK', slug: 'apis/dotnet-sdk' },
					],
				},
				{
					label: 'Concepts',
					items: [
						{ label: 'Connector Basics', slug: 'concepts/connector-basics' },
						{
							label: 'Open Source vs Enterprise',
							slug: 'concepts/open-source-vs-enterprise',
						},
					],
				},
			],
		}),
	],
});
