import type { Config } from "tailwindcss";

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        dark: {
          "50": "#f7f7f8",
          "100": "#efedf1",
          "200": "#dad8df",
          "300": "#bab6c3",
          "400": "#948ea2",
          "500": "#777087",
          "600": "#615a6f",
          "700": "#4f495b",
          "800": "#443f4d",
          "900": "#3c3842",
          "950": "#1c1a1f",
        },
        brand: {
          highlight: "#E2FF03",
          black: "#333",
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
