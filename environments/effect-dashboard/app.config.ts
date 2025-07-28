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
            root: "bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 mb-4",
            header:
              "bg-stone-100 dark:bg-zinc-800 border-b border-stone-200 dark:border-zinc-700",
            body: "p-0 sm:p-0 bg-stone-50 dark:bg-zinc-700",
            footer:
              "bg-stone-100 dark:bg-zinc-800 border-t border-stone-200 dark:border-zinc-700",
          },
        },
      },
    },
  },
});
