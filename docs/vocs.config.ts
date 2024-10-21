import { defineConfig } from 'vocs'

export default defineConfig({
  rootDir: __dirname,
  theme: {
    variables: {
      fontFamily: {
        default: 'Raleway'
      }
    }
  },
  sidebar: [
    {
      text: 'Core Concepts',
      link: '/docs/core-concepts',
      items: [
        {
          text: 'Worker Nodes',
          link: '/docs/core-concepts/worker-nodes'
        },
        {
          text: 'Manager Nodes',
          link: '/docs/core-concepts/manager-nodes'
        },
        {
          text: 'Task Providers',
          link: '/docs/core-concepts/task-providers'
        }
      ]

    }
  ],
  title: 'Effect.AI Task Network',
})