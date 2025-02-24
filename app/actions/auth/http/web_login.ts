import User from '#models/user'
import { loginValidator } from '#validators/login'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { Infer } from '@vinejs/vine/types'

type Params = {
    data: Infer<typeof loginValidator>
}

@inject()
export default class WebLogin {
    constructor(protected ctx: HttpContext) {}

    async handle({ data }: Params) {
        // Retrieve the user by username or email
        const user = await User.verifyCredentials(data.identifier, data.password)
        await this.ctx.auth.use('web').login(user, data.rememberMe)

        return user
    }
}
