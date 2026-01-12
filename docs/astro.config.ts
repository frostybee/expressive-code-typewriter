import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://frostybee.github.io',
  base: '/expressive-code-typewriter',
  integrations: [
    starlight({
      title: 'Expressive Code Typewriter',
      favicon: '/images/typewriter.svg',
      description: 'Add typewriter-style typing animations to your code blocks.',
      editLink: {
        baseUrl: 'https://github.com/frostybee/expressive-code-typewriter/edit/main/docs/',
      },
      sidebar: [
        {
          label: 'Start Here',
          items: ['getting-started', 'configuration', 'usage'],
        },
        {
          label: 'Demos',
          items: ['demos/examples'],
        },
      ],
      social: [
        { href: 'https://github.com/frostybee/expressive-code-typewriter', icon: 'github', label: 'GitHub' },
      ],
    }),
  ],
})
