import { defineConfig } from "vocs";

export default defineConfig({
	rootDir: __dirname,
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
					link: "/",
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
					link: "/protocol/core-concepts",
				},

				{
					text: "Nodes",
					items: [
						{
							text: "Provider",
							link: "/protocol/nodes/provider-node",
						},
						{
							text: "Manager",
							link: "/protocol/nodes/manager-node",
						},
						{
							text: "Worker",
							link: "/protocol/nodes/worker-node",
						},
					],
				},
				{
					text: "Data Lifecycle",
					link: "/protocol/data-lifecycle",
				},
				{
					text: "Settlements",
					link: "/protocol/settlements",
				},
				{
					text: "Incentives",
					link: "/protocol/incentives",
					items: [
						{
							text: "Static Income",
							link: "/protocol/incentives#static-income",
						},
						{
							text: "Penalties",
							link: "/protocol/incentives#penalties",
						},
						{
							text: "Staking",
							link: "/protocol/incentives#staking",
						},
						{
							text: "Fees",
							link: "/protocol/incentives#fees",
						},
					],
				},
				{
					text: "Governance",
					items: [
						{
							text: "Dispute Resolution",
							link: "/protocol/governance#dispute-resolution",
						},
						{
							text: "Voting",
							link: "/protocol/governance#voting",
						},
					],
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
