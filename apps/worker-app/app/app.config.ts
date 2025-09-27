export default defineAppConfig({
  ui: {
    colors: {
      primary: "stone",
      neutral: "zinc",
    },
    card: {
      defaultVariants: {
        variant: "subtle",
      },
      variants: {
        variant: {
          mono: {
            root: "bg-gradient-to-br from-stone-100 via-white text-white to-stone-200 from-zinc-700 via-zinc-500 dark:to-zinc-800 border border-stone-200 dark:border-zinc-700 mb-4",
            body: "p-0 sm:p-0 bg-stone-50 dark:bg-zinc-700",
          },
        },
      },
    },
  },
});
