import type { Config } from "tailwindcss";

export default {
	content: [],
	theme: {
		extend: {
			colors: {
				dark: {
					'50': '#f7f7f8',
					'100': '#efedf1',
					'200': '#dad8df',
					'300': '#bab6c3',
					'400': '#948ea2',
					'500': '#777087',
					'600': '#615a6f',
					'700': '#4f495b',
					'800': '#443f4d',
					'900': '#3c3842',
					'950': '#1c1a1f',
				},
				neonYellow: {
					"50": "#ffffe4",
					"100": "#feffc4",
					"200": "#faff90",
					"300": "#f1ff50",
					"400": "#e2ff03",
					"500": "#c6e600",
					"600": "#99b800",
					"700": "#748b00",
					"800": "#5b6d07",
					"900": "#4c5c0b",
					"950": "#283400",
				},
				chestnut: {
					"50": "#fcf5f4",
					"100": "#fae8e6",
					"200": "#f6d5d2",
					"300": "#efb7b2",
					"400": "#e48d85",
					"500": "#d6675d",
					"600": "#c4544a",
					"700": "#a23c33",
					"800": "#86352e",
					"900": "#70322c",
					"950": "#3c1613",
				},
				brand: {
					highlight: "#E2FF03",
					black: "#1C1A1F",
				},
			},
			fontFamily: {
				header: ['"Inter"', "sans-serif"],
				body: ['"Geist"', "sans-serif"],
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
} satisfies Config;
