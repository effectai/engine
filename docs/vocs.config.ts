import { defineConfig } from "vocs";

export default defineConfig({
	rootDir: __dirname,
	basePath: "/docs/",
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
					text: "Project overview",
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
			text: "Network Architecture",
			items: [
				{
					text: "Entities & Roles",
					link: "/network-architecture/entities",
					items: [
						{
							text: "Provider Nodes",
							link: "/network-architecture/entities/provider-node",
						},
						{
							text: "Manager Nodes",
							link: "/network-architecture/entities/manager-node",
						},
						{
							text: "Worker Nodes",
							link: "/network-architecture/entities/worker-node",
						},
					]
				},
				{
					text: "Data Lifecycle",
					link: "/network-architecture/batch-lifecycle",
				},
			],
		},
		{
			text: 'Governance',
			items: [
				{
					text: 'DAO',
					link: '/governance/dao',
				},
				{
					text: 'Dispute Resolution',
					link: '/governance/governance-token',
				},
				{
					text: 'Voting',
					link: '/governance/voting',
				},
			],
		},
		{
			text: "Setting up Nodes",
			items: [
				{
					text: "Worker Node",
					link: "/node-setup/worker-nodes",
				},
				{
					text: "Manager Node",
					link: "/node-setup/manager-nodes",
				},
				{
					text: "Task Provider",
					link: "/node-setup/task-providers",
				},
			],
		},
	],
	title: "Effect.AI Task Network",
});
