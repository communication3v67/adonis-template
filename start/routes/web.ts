import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const GmbPostsController = () => import('#controllers/gmbPostsController')

/* ignore formmating, as I find it easier to scan single line route definitions */
/* prettier-ignore-start */

router
    .group(() => [
        router.on('/').renderInertia('home').as('home'),
        router
            .group(() => [
                // Routes principales CRUD
                router.get('/', [GmbPostsController, 'index']).as('index'),
                router.get('/create', [GmbPostsController, 'create']).as('create'),
                router.post('/', [GmbPostsController, 'store']).as('store'),
                router.get('/stats', [GmbPostsController, 'stats']).as('stats'),
                router.get('/export', [GmbPostsController, 'export']).as('export'),
                router.get('/:id', [GmbPostsController, 'show']).as('show'),
                router.get('/:id/edit', [GmbPostsController, 'edit']).as('edit'),
                router.put('/:id', [GmbPostsController, 'update']).as('update'),
                router.delete('/:id', [GmbPostsController, 'destroy']).as('destroy'),
                
                // Actions spéciales
                router.post('/:id/duplicate', [GmbPostsController, 'duplicate']).as('duplicate'),
                router.delete('/', [GmbPostsController, 'bulkDestroy']).as('bulk_destroy'),
            ])
            .as('gmbPosts')
            .prefix('/gmb-posts'),
    ])
    .use(middleware.auth())

// Routes API (sans middleware auth si nécessaire, ou avec middleware API)
router
    .group(() => [
        router.get('/projects-by-client', [GmbPostsController, 'getProjectsByClient']).as('projects_by_client'),
    ])
    .prefix('/api')
    .as('api')
