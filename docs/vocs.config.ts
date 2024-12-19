import { defineConfig } from "vocs";

export default defineConfig({
	rootDir: __dirname,
	basePath: "/docs/",
	logoUrl: { light: "/logo-dark.svg", dark: "/logo-light.svg" },
	theme: {
		variables: {
			fontFamily: {
				default: "Raleway",
			},
		},
	},
	sidebar: [
		{
			text: "Introduction",
			items: [
				{
					text: "Overview",
					link: "/introduction/project-overview",
				},
				{
					text: "Our Mission",
					link: "/introduction/our-mission",
				},
				{
					text: "Glossary",
					link: "/introduction/glossary",
				},
			],
		},
		{
			text: "Protocol",
			items: [
			
				{
					text: "Core Concepts",
					link: "/protocol/key-concepts",
				},
				{
					text: "Architecture",
					items: [
						{
							text: "Network Architecture",
						},
						{
							text: "Data Flow",
							link: "/protocol/architecture/data-flow",
						},
					]
				},
				{
					text: "Components",
					items: [
							{
								text: "Provider Nodes",
								link: "/protocol/components/provider-node",
							},
							{
								text: "Manager Nodes",
								link: "/protocol/components/manager-node",
							},
							{
								text: "Worker Nodes",
								link: "/protocol/components/worker-node",
							},
					]
				},
				
				{
					text: "Incentives",
					items: [
						{
							text: "Static Income",
						},
						{
							text: "Penalties",
						},
						{
							text: "Staking",
						},
						{
							text: "Fees",
						},
					],
				},
				{
					text: "Governance",
					items: [
						{
							text: "Dispute Resolution",
						},
						{
							text: "Voting",
						},
					]
				},
			],
		},
		{
			text: "Setting up Nodes",
			items: [
				{
					text: "Provider Node",
				},
				{
					text: "Manager Node",
				},
				{
					text: "Worker Node",
				},
			],
		},
	],
	title: "Effect AI",
});
