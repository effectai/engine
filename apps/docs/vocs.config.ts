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
          text: "Token",
          link: "/token",
        },
        {
          text: "Staking",
          link: "/protocol/staking",
        },
        // {
        // 	text: "Nodes",
        // 	items: [
        // 		{
        // 			text: "Provider",
        // 			link: "/protocol/nodes/provider-node",
        // 		},
        // 		{
        // 			text: "Manager",
        // 			link: "/protocol/nodes/manager-node",
        // 		},
        // 		{
        // 			text: "Worker",
        // 			link: "/protocol/nodes/worker-node",
        // 		},
        // 	],
        // },
        // {
        // 	text: "Data Lifecycle",
        // 	link: "/protocol/data-lifecycle",
        // },

        // {
        // 	text: "Incentives",
        // 	link: "/protocol/incentives",
        // 	items: [
        // 		{
        // 			text: "Static Income",
        // 			link: "/protocol/incentives#static-income",
        // 		},
        // 		{
        // 			text: "Penalties",
        // 			link: "/protocol/incentives#penalties",
        // 		},
        // 		{
        // 			text: "Staking",
        // 			link: "/protocol/incentives#staking",
        // 		},
        // 		{
        // 			text: "Fees",
        // 			link: "/protocol/incentives#fees",
        // 		},
        // 	],
        // },
        {
          text: "Governance",
          link: "/protocol/governance",
        },
      ],
    },
    {
      text: "API Reference",
      items: [
        {
          text: "Getting Started",
          link: "/api",
        },
        {
          text: "Account",
          link: "/api/account",
        },
        {
          text: "API Keys",
          link: "/api/keys",
        },
        {
          text: "Credits",
          link: "/api/credits",
        },
        {
          text: "Templates",
          link: "/api/templates",
        },
        {
          text: "Jobs",
          link: "/api/jobs",
        },
      ],
    },
    {
      text: "Community",
      items: [
        {
          text: "Socials",
          link: "/community/socials",
        },
        {
          text: "Community Guidelines",
          link: "/community/guidelines",
        },
        {
          text: "Contributing",
          link: "/community/contributing",
        },
      ],
    },
  ],
  title: "Effect AI",
});
