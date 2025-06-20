-- Ajout de la colonne city à la table gmb_posts
ALTER TABLE gmb_posts ADD COLUMN city VARCHAR(255) NULL;

-- Optionnel : ajouter un index pour optimiser les requêtes de recherche
CREATE INDEX idx_gmb_posts_city ON gmb_posts(city);
