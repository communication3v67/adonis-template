import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

/* ignore formmating, as I find it easier to scan single line route definitions */
/* prettier-ignore-start */

router.on('/').renderInertia('home').as('home').use(middleware.auth())
