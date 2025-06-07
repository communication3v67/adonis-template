import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const GmbPostsController = () => import('#controllers/gmb_posts_controller')

/* ignore formmating, as I find it easier to scan single line route definitions */
/* prettier-ignore-start */

router
    .group(() => [
        router.on('/').renderInertia('home').as('home'),
        router
            .group(() => [
                router.get('/', [GmbPostsController, 'index']).as('index'),
                router.get('/create', [GmbPostsController, 'create']).as('create'),
                router.post('/', [GmbPostsController, 'store']).as('store'),
                router.get('/:id/edit', [GmbPostsController, 'edit']).as('edit'),
                router.put('/:id', [GmbPostsController, 'update']).as('update'), // <-- REST! ✔️
                router.delete('/:id', [GmbPostsController, 'destroy']).as('destroy'),
            ])
            .as('gmb_posts')
            .prefix('/gmb_posts'),
    ])
    .use(middleware.auth())
