import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'MarkItUp',
    description: 'AI-powered image annotation tool',
    permissions: ['storage', 'identity'],
    oauth2: {
      client_id: '561880138172-82rvojp47km71hub6ej6d27nl9nser5b.apps.googleusercontent.com',
      scopes: ['openid', 'email', 'profile'],
    },
    action: {},
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
