/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />
/// <reference path="../../config/auth.ts" />

import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { SharedProps } from '@adonisjs/inertia/types'
import { createInertiaApp } from '@inertiajs/react'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import { hydrateRoot } from 'react-dom/client'
import AppLayout from '~/layouts/app-layout/app-layout'
import mantineTheme from '~/lib/mantine_theme'
import '../css/app.css'

const appName = import.meta.env.VITE_APP_NAME || 'GMB Manager'

createInertiaApp({
    progress: { color: '#5468FF' },

    title: (title) => `${title} - ${appName}`,

    resolve: async (name) => {
        const page: any = await resolvePageComponent(
            `../pages/${name}.tsx`,
            import.meta.glob('../pages/**/*.tsx')
        )

        page.default.layout =
            page.default.layout ??
            ((page: React.JSX.Element) => {
                // Ouvrir la sidebar par défaut pour la page GMB Posts
                const sidebarOpened = name === 'gmbPosts/index'
                return (
                    <AppLayout {...(page.props as SharedProps)} sidebarOpened={sidebarOpened}>
                        {page}
                    </AppLayout>
                )
            })

        return page
    },

    setup({ el, App, props }) {
        hydrateRoot(
            el,
            <MantineProvider theme={mantineTheme}>
                <App {...props} />
            </MantineProvider>
        )
    },
})
