import router from '@adonisjs/core/services/router'
import { middleware } from '../kernel.js'
const LoginController = () => import('#controllers/auth/login_controller')
const LogoutController = () => import('#controllers/auth/logout_controller')

/* ignore formmating, as I find it easier to scan single line route definitions */
/* prettier-ignore-start */

router.post('/logout', [LogoutController, 'handle']).as('logout').use(middleware.auth())

router.get('/login', [LoginController, 'show']).as('login.show').use(middleware.guest())
router.post('/login', [LoginController, 'store']).as('login.store').use(middleware.guest())
