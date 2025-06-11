import { getDirname } from '@adonisjs/core/helpers'
import inertia from '@adonisjs/inertia/client'
import adonisjs from '@adonisjs/vite/client'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [
        inertia({ ssr: { enabled: true, entrypoint: 'inertia/app/ssr.tsx' } }),
        react(),
        adonisjs({
            entrypoints: ['inertia/app/app.tsx'],
            reload: ['resources/views/**/*.edge'],
        }),
    ],
    
    // Configuration pour corriger les erreurs de modules
    optimizeDeps: {
        exclude: ['@notionhq/client'],
        include: ['react', 'react-dom', '@mantine/core', '@mantine/hooks']
    },
    
    // Force la reconstruction des dépendances
    server: {
        force: true,
        fs: {
            strict: false
        }
    },
    
    /**
     * Define aliases for importing modules from
     * your frontend code
     */
    resolve: {
        alias: {
            '~/': `${getDirname(import.meta.url)}/inertia/`,
            '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        },
    },
})
