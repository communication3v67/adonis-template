-- Script de test pour vérifier l'ajout du champ "informations" à la table gmb_posts

-- 1. Vérifier la structure de la table après migration
DESCRIBE gmb_posts;

-- 2. Vérifier que la colonne "informations" a été ajoutée
SHOW COLUMNS FROM gmb_posts LIKE 'informations';

-- 3. Test d'insertion avec le nouveau champ
-- (Remplacez les valeurs par des données appropriées pour votre système)
/*
INSERT INTO gmb_posts (
    user_id, status, text, date, client, project_name, location_id, account_id, 
    informations, created_at, updated_at
) VALUES (
    1, 'draft', 'Test post avec informations', NOW(), 'Test Client', 'Test Project', 
    'test_location', 'test_account', 'Voici des informations supplémentaires pour ce post', 
    NOW(), NOW()
);
*/

-- 4. Test de mise à jour du champ informations
/*
UPDATE gmb_posts 
SET informations = 'Informations mises à jour' 
WHERE id = 1;
*/

-- 5. Test de sélection avec le nouveau champ
SELECT id, status, text, informations, created_at 
FROM gmb_posts 
LIMIT 5;

-- 6. Vérifier que les valeurs NULL sont acceptées
/*
UPDATE gmb_posts 
SET informations = NULL 
WHERE id = 1;
*/
