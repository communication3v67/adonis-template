import { SharedProps } from '@adonisjs/inertia/types'
import { createInertiaApp } from '@inertiajs/react'
import { MantineProvider } from '@mantine/core'
import ReactDOMServer from 'react-dom/server'
import AppLayout from '~/layouts/app-layout/app-layout'
import mantineTheme from '~/lib/mantine_theme'

export default function render(page: any) {
    return createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: (name) => {
            const pages = import.meta.glob('../pages/**/*.tsx', { eager: true })
            const page: any = pages[`../pages/${name}.tsx`]

            page.default.layout =
                page.default.layout ??
                ((page: React.JSX.Element) => (
                    <AppLayout {...(page.props as SharedProps)}>{page}</AppLayout>
                ))

            return page
        },
        setup: ({ App, props }) => (
            <MantineProvider theme={mantineTheme}>
                <App {...props} />
            </MantineProvider>
        ),
    })
}
