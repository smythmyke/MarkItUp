import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'MarkItUp',
    description: 'Turn screenshots into marketing visuals with AI — pick a template, describe your vision, get polished designs fast.',
    permissions: ['storage', 'identity'],
    oauth2: {
      client_id: '561880138172-82rvojp47km71hub6ej6d27nl9nser5b.apps.googleusercontent.com',
      scopes: ['openid', 'email', 'profile'],
    },
    action: {},
    content_security_policy: {
      sandbox:
        "sandbox allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;",
    },
    sandbox: {
      pages: ['sandbox.html'],
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
