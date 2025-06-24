# Système de Persistance des Colonnes - GMB Posts

## Vue d'ensemble

Ce système permet de sauvegarder automatiquement l'état des colonnes du tableau (visibilité et largeurs) dans le localStorage du navigateur. Les préférences sont restaurées lors du rechargement de la page.

## Fonctionnalités

### 🔧 Gestion de la visibilité
- **Masquer/Afficher** des colonnes individuelles
- **Colonnes obligatoires** : certaines colonnes (checkbox, readiness, actions) ne peuvent pas être masquées
- **Actions rapides** : "Tout afficher" et "Colonnes essentielles"

### 📏 Redimensionnement
- **Redimensionnement manuel** des colonnes par glisser-déposer
- **Largeurs minimales et maximales** configurées pour chaque colonne
- **Réinitialisation des largeurs** aux valeurs par défaut

### 💾 Persistance automatique
- **Sauvegarde automatique** dans localStorage à chaque modification
- **Restauration automatique** au chargement de la page
- **Fusion intelligente** avec les nouvelles colonnes ajoutées dans les mises à jour

## Structure technique

### Hook principal : `useColumnPersistence`

```typescript
const { 
    columns, 
    setColumns, 
    resetWidths, 
    resetToDefaults, 
    isLoaded 
} = useColumnPersistence()
```

#### Propriétés retournées

- `columns` : Configuration actuelle des colonnes
- `setColumns` : Fonction pour mettre à jour les colonnes (sauvegarde automatique)
- `resetWidths` : Réinitialise uniquement les largeurs
- `resetToDefaults` : Réinitialise complètement la configuration
- `isLoaded` : Indique si la configuration a été chargée depuis localStorage

### Configuration des colonnes

Chaque colonne est définie par une interface `ColumnConfig` :

```typescript
interface ColumnConfig {
    key: string           // Identifiant unique
    label: string         // Libellé affiché
    visible: boolean      // Visibilité de la colonne
    width: number         // Largeur actuelle en pixels
    minWidth?: number     // Largeur minimale
    maxWidth?: number     // Largeur maximale
    required?: boolean    // Colonne obligatoire (non masquable)
}
```

### Stockage localStorage

- **Clé** : `gmb-posts-columns-state`
- **Format** : JSON sérialisé de l'array `ColumnConfig[]`
- **Gestion d'erreurs** : Retour aux valeurs par défaut en cas de corruption

## Utilisation

### Interface utilisateur

1. **Bouton de gestion** (icône engrenage) dans la barre d'état
2. **Drawer latéral** avec options de configuration
3. **Actions rapides** :
   - Tout afficher
   - Colonnes essentielles
   - Réinitialiser largeurs
   - Réinitialiser tout (nouveau)

### Redimensionnement

- Glisser les bordures droites des en-têtes de colonnes
- Respect des limites min/max configurées
- Sauvegarde automatique de la nouvelle largeur

## Migration et évolutivité

### Ajout de nouvelles colonnes

Le système est conçu pour gérer l'ajout de nouvelles colonnes sans perdre la configuration existante :

1. La nouvelle colonne est ajoutée aux `DEFAULT_COLUMNS`
2. Lors du chargement, la fonction `mergeWithDefaults()` :
   - Préserve les colonnes existantes configurées
   - Ajoute les nouvelles colonnes avec leurs valeurs par défaut
   - Maintient l'ordre défini dans `DEFAULT_COLUMNS`

### Gestion des erreurs

- **Parsing JSON échoué** : Retour aux valeurs par défaut
- **Colonnes manquantes** : Fusion avec les colonnes par défaut
- **localStorage indisponible** : Fonctionnement en mode mémoire uniquement

## Composants impliqués

### `ColumnVisibilityManager`
- Interface utilisateur pour gérer les colonnes
- Drawer avec liste des colonnes et options

### `PostsTable`
- Utilise les colonnes pour le rendu du tableau
- Gère le redimensionnement des colonnes

### `PostRow`
- Rend chaque ligne selon les colonnes visibles
- Utilise les largeurs configurées

### `StatusIndicators`
- Intègre le bouton de gestion des colonnes
- Passe les propriétés nécessaires

## Avantages

### Pour l'utilisateur
- **Expérience personnalisée** : chaque utilisateur peut adapter l'interface
- **Productivité améliorée** : colonnes adaptées au workflow
- **Persistance** : configuration conservée entre les sessions

### Pour les développeurs
- **Système extensible** : facile d'ajouter de nouvelles colonnes
- **Centralisation** : toute la logique dans un hook dédié
- **Type-safe** : TypeScript pour éviter les erreurs
- **Testable** : logique isolée et pure

## Exemple d'utilisation complète

```typescript
// Dans le composant principal
const { columns, setColumns, resetWidths, resetToDefaults, isLoaded } = useColumnPersistence()

// Attendre le chargement avant de rendre l'interface
if (!isLoaded) return <LoadingSpinner />

// Passer aux composants enfants
<StatusIndicators
    columns={columns}
    onColumnsChange={setColumns}
    onResetWidths={resetWidths}
    onResetToDefaults={resetToDefaults}
    // ... autres props
/>

<PostsTable
    columns={columns}
    onColumnsChange={setColumns}
    // ... autres props
/>
```

## Configuration par défaut

Les colonnes par défaut incluent :
- **Obligatoires** : Checkbox, Readiness, Actions
- **Visibles par défaut** : Status, Text, Date, Keyword, Client, Project, City, Price, Image, Link, Informations
- **Masquées par défaut** : Model, Input/Output Tokens, Location ID, Account ID, Notion ID

La configuration peut être ajustée dans `DEFAULT_COLUMNS` dans le fichier `useColumnPersistence.ts`.
