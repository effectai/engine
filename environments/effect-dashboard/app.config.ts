export default defineAppConfig({
    ui: {
      primary: 'green',
      gray: 'dark',
      card: {
        background: 'bg-white dark:!bg-[#1C1A1F]',
      },
      button: {
        default: {
          size: 'md',
        },
        padding: {
          xs: 'py-2 px-2',
          sm: 'py-2 px-3',
          md: 'py-2 px-4',
          lg: 'py-4 px-5',
        },
        rounded: 'rounded-md',
        color: {
          highlight: {
            outline: 'border-highlight text-highlight hover:bg-highlight hover:text-black',
            solid: 'bg-highlight text-black hover:bg-highlight-600',
          }
        },
      }
    },
  })