import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
    vine.object({
        identifier: vine.string().maxLength(255),
        password: vine.string().minLength(8).maxLength(255),
        rememberMe: vine.boolean().optional(),
    })
)
