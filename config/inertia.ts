import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import UserDto from '#dtos/user'

const inertiaConfig = defineConfig({
    /**
     * Path to the Edge view that will be used as the root view for Inertia responses
     */
    rootView: 'inertia_layout',

    /**
     * Data that should be shared with all rendered pages
     */
    sharedData: {
        exceptions: (ctx) => ctx.session?.flashMessages.get('errorsBag', {}),
        messages: (ctx) => ctx.session?.flashMessages.all() ?? {},
        errors: (ctx) =>
            ctx.inertia.always(() => {
                const errors =
                    ctx.session?.flashMessages.get('errors') ?? ({} as Record<string, string[]>)
                undefined

                return Object.keys(errors)?.reduce(
                    (acc, key) => ({
                        ...acc,
                        [key]: errors[key].join(', '),
                    }),
                    {} as Record<string, string>
                )
            }),
        user: (ctx) => {
            const user = ctx.auth.user

            return user ? new UserDto(user) : null
        },
    },

    /**
     * Options for the server-side rendering
     */
    ssr: {
        enabled: true,
        entrypoint: 'inertia/app/ssr.tsx',
    },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
    export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
