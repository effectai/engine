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
			text: "Protocol",
			items: [
				{
					text: "Entities & Roles",
					collapsed: true,
					link: "/network-architecture/entities",
					items: [
						{
							text: "Provider",
							link: "/network-architecture/entities/provider-node",
						},
						{
							text: "Manager",
							link: "/network-architecture/entities/manager-node",
						},
						{
							text: "Worker",
							link: "/network-architecture/entities/worker-node",
						},
					],
				},
				{
					text: "Task Lifecycle",
					link: "/network-architecture/task-lifecycle",
					items: [
						{
							text: "Creation",
						},
						{
							text: "Delegation",
						},
						{
							text: "Execution",
						},
						{
							text: "Validation",
						},
						{
							text: "Completion",
						},
					],
				},
				{
					text: "Rewards & Incentives",
					items: [
						{
							text: "Universal Static Income",
						},
						{
							text: "Penalties",
						},
						{
							text: "Staking",
						},
						{
							text: "Fees",
						}
					]
				},
				{
					text: "Consensus and Validation",
				},
			],
		},
		{
			text: "Governance",
			items: [
				{
					text: "DAO",
					link: "/governance/dao",
				},
				{
					text: "Dispute Resolution",
					link: "/governance/governance-token",
				},
				{
					text: "Voting",
					link: "/governance/voting",
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
	title: "Effect AI: Docs",
});
