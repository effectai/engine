export default defineAppConfig({
    ui: {
      primary: 'green',
      gray: 'dark',
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