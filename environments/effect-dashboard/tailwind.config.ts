import type { Config } from "tailwindcss";

export default {
	content: [],
	theme: {
		extend: {
			colors: {
				highlight: '#E2FF03'
			},
			fontFamily: {
				header: ['"Inter"', "sans-serif"],
				body: ['"Geist"', "sans-serif"],
			},
		},
	},
	plugins: [
		require('@tailwindcss/forms'),
	],
} satisfies Config;
