// Constantes pour les posts GMB

export const POST_STATUSES = [
    'Titre généré',
    'Post à générer',
    'Post généré',
    'Post à publier',
    'Publié',
    'failed',
] as const

export const STATUS_COLORS: Record<string, string> = {
    'Titre généré': 'blue',
    'Post à générer': 'yellow',
    'Post généré': 'cyan',
    'Post à publier': 'violet',
    'Publié': 'green',
    'failed': 'red',
}

export const SORT_LABELS: Record<string, string> = {
    date: 'Date',
    status: 'Statut',
    text: 'Texte',
    client: 'Client',
    project_name: 'Projet',
    keyword: 'Mot-clé',
    location_id: 'Location ID',
    account_id: 'Account ID',
    notion_id: 'Notion ID',
    createdAt: 'Créé le',
    updatedAt: 'Modifié le',
}

// Options de périodes rapides pour les filtres
export const QUICK_DATE_PERIODS = [
    { value: '', label: 'Toutes les dates' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'yesterday', label: 'Hier' },
    { value: 'tomorrow', label: 'Demain' },
    { value: 'last7days', label: '7 derniers jours' },
    { value: 'next7days', label: '7 prochains jours' },
    { value: 'last30days', label: '30 derniers jours' },
    { value: 'next30days', label: '30 prochains jours' },
    { value: 'thismonth', label: 'Ce mois-ci' },
    { value: 'lastmonth', label: 'Mois dernier' },
    { value: 'nextmonth', label: 'Mois prochain' },
] as const

// Configuration pour le scroll infini
export const INFINITE_SCROLL_CONFIG = {
    ITEMS_PER_PAGE: 50,
    SCROLL_THRESHOLD: 200, // pixels avant le bas de page
    THROTTLE_DELAY: 100, // ms pour le throttling du scroll
} as const
