import WebLogin from '#actions/auth/http/web_login'
import { loginValidator } from '#validators/login'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class LoginController {
    async show({ inertia }: HttpContext) {
        return inertia.render('login/login')
    }

    @inject()
    async store({ request, response, session }: HttpContext, webLogin: WebLogin) {
        const data = await request.validateUsing(loginValidator)

        await webLogin.handle({ data })

        session.flash('success', 'You are now logged in.')

        return response.redirect().toPath('/')
    }
}
