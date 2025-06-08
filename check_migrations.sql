-- Vérifier si la table gmb_posts existe et sa structure
DESCRIBE gmb_posts;

-- Vérifier quelles migrations ont été exécutées
SELECT * FROM adonis_schema;

-- Vérifier s'il y a des posts avec user_id NULL
SELECT COUNT(*) as posts_without_user FROM gmb_posts WHERE user_id IS NULL;

-- Voir quelques exemples de posts
SELECT id, user_id, status, text, created_at FROM gmb_posts LIMIT 5;
