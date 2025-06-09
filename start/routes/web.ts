import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const GmbPostsController = () => import('#controllers/gmbPostsController')
const HomeController = () => import('#controllers/home_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')

/* ignore formmating, as I find it easier to scan single line route definitions */
/* prettier-ignore-start */

router
    .group(() => [
        router.get('/', [HomeController, 'index']).as('home'),
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
                router.post('/bulk-update', [GmbPostsController, 'bulkUpdate']).as('bulk_update'),
                
                // Action webhook pour envoyer les posts à générer vers n8n
                router.post('/send-to-n8n', [GmbPostsController, 'sendPostsToN8n']).as('send_to_n8n'),
            ])
            .as('gmbPosts')
            .prefix('/gmb-posts'),
    ])
    .use(middleware.auth())

// Routes API (sans middleware auth si nécessaire, ou avec middleware API)
router
    .group(() => [
        router
            .get('/projects-by-client', [GmbPostsController, 'getProjectsByClient'])
            .as('projects_by_client'),
        // Route API pour les pages Notion
        router
            .get('/notion-pages', [HomeController, 'getNotionPages'])
            .as('notion_pages'),
    ])
    .prefix('/api')
    .as('api')

// Routes Webhooks
router
    .group(() => [
        // Route pour actualiser les données (si besoin)
    ])
    .prefix('/webhook')
    .as('webhook')
    .use(middleware.auth())

// Routes webhook POST sans CSRF (pour les appels depuis l'interface)
router
    .post('/webhook/n8n', [WebhooksController, 'sendToN8n'])
    .as('webhook.n8n')
    .use(middleware.auth())

// Route webhook POST BULK pour envoi en lot
router
    .post('/webhook/n8n-bulk', [WebhooksController, 'sendBulkToN8n'])
    .as('webhook.n8n_bulk')
    .use(middleware.auth())
