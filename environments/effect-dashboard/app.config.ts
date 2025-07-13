export default defineAppConfig({
  ui: {
    colors: {
      primary: "emerald",
      neutral: "zinc",
    },
    card: {
      defaultVariants: {
        variant: "subtle",
      },
      variants: {
        variant: {
          mono: {
            header: "bg-stone-100 dark:bg-[#1c1917]",
            root: "bg-stone-200 dark:bg-[#333]",
            body: "p-0 sm:p-0",
          },
        },
      },
    },
  }, // Add other UI configurations as needed
});
