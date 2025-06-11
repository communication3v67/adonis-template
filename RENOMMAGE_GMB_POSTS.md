# Renommage GMB Posts - Migration vers les conventions AdonisJS

## Problème initial
Le modèle `gmb_post.ts` causait l'erreur : `this.namingStrategy.tableName is not a function`

## Solution appliquée

### 1. Modèle
- **Ancien** : `app/models/gmb_post.ts` avec naming strategy personnalisée
- **Nouveau** : `app/models/gmbPost.ts` avec `public static table = 'gmb_posts'`
- **Classe** : `GmbPost` (reste en camelCase)
- **Table** : `gmb_posts` (reste en snake_case)

### 2. Contrôleur
- **Ancien** : `app/controllers/gmb_posts_controller.ts`
- **Nouveau** : `app/controllers/gmbPostsController.ts`
- **Import** : `import GmbPost from '#models/gmbPost'`

### 3. Routes
- **Fichier** : `start/routes/web.ts`
- **Import** : `const GmbPostsController = () => import('#controllers/gmbPostsController')`
- **Nom des routes** : `.as('gmbPosts')` au lieu de `.as('gmb_posts')`
- **URLs** : Gardent le format `/gmb-posts/...`

### 4. Vues Inertia
- **Ancien dossier** : `inertia/pages/gmb-posts/`
- **Nouveau dossier** : `inertia/pages/gmbPosts/`
- **Vues mises à jour** : 
  - `gmbPosts/index`
  - `gmbPosts/create`
  - `gmbPosts/show`
  - `gmbPosts/edit`
  - `gmbPosts/stats`

### 5. Seeders et Migrations
- **Migration** : `database/migrations/1749292942708_create_gmb_posts_table.ts` (inchangé)
- **Seeder** : `database/seeders/gmbPostSeeder.ts` avec import mis à jour

### 6. Corrections dans la vue index.tsx
- Ajout de `preserveState: false` dans la modal pour forcer le rechargement des données
- Suppression des mappings camelCase/snake_case redondants
- Amélioration du debugging

## Fichiers modifiés/créés

### Modifiés
- `start/routes/web.ts` - Import et noms de routes
- `app/controllers/gmbPostsController.ts` - Import du modèle et noms de routes
- `database/seeders/gmbPostSeeder.ts` - Import du modèle
- `inertia/pages/gmbPosts/index.tsx` - Fix de l'actualisation du tableau

### Créés
- `app/models/gmbPost.ts` - Nouveau modèle avec table explicite
- `app/controllers/gmbPostsController.ts` - Contrôleur renommé
- `database/seeders/gmbPostSeeder.ts` - Seeder renommé
- `inertia/pages/gmbPosts/` - Dossier de vues renommé
- `inertia/pages/gmbPosts/create.tsx` - Vue de création

### Supprimés/Renommés
- `app/models/gmb_post.ts` → sauvegardé comme `gmb_post_backup.ts`
- `app/controllers/gmb_posts_controller.ts` → `gmbPostsController.ts`
- `database/seeders/gmb_post_seeder.ts` → `gmbPostSeeder.ts`
- `inertia/pages/gmb-posts/` → `gmbPosts/`

## Test des changements

1. Vérifier que l'application démarre sans erreur
2. Tester l'affichage de la liste des posts
3. Tester la création d'un nouveau post
4. Tester la modification d'un post existant (modal)
5. Vérifier que le tableau se met à jour après modification
6. Tester la suppression et duplication

## Notes importantes

- Les URLs publiques restent en `/gmb-posts/...` pour éviter de casser les liens existants
- La table de base de données garde le nom `gmb_posts`
- Les noms des colonnes restent en snake_case comme attendu par AdonisJS
- Le modèle utilise maintenant `public static table = 'gmb_posts'` au lieu d'une naming strategy custom
